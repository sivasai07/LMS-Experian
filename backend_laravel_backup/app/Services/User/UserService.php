<?php

declare(strict_types=1);

namespace App\Services\User;

use App\Exceptions\DomainException;
use App\Mail\WelcomeEmployeeMail;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * All User Management business logic.
 *
 * Controllers pass primitive IDs; this service resolves models, applies
 * business rules, and returns fully-loaded User instances.
 *
 * The authenticated user is resolved from the JWT guard — controllers
 * never touch the auth layer.
 */
class UserService
{
    public function __construct(
        private readonly \App\Services\Leave\LeaveBalanceService $leaveBalanceService,
    ) {
    }

    /** Relationships loaded for detail views (show, profile, store, update). */
    private const WITH_DETAIL = [
        'role',
        'department',
        'gradeJobTitle.grade',
        'gradeJobTitle.jobTitle',
        'manager',
        'leaveBalances',
    ];

    /** Lighter relationship set for list/paginated views. */
    private const WITH_LIST = [
        'role',
        'department',
        'gradeJobTitle.jobTitle',
        'gradeJobTitle.grade',
        'manager',
    ];

    // -----------------------------------------------------------------------
    // HR: full user list with search / filter / sort / pagination
    // -----------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $filters  Query-string parameters.
     * @return LengthAwarePaginator<User>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $includeTrashed = filter_var($filters['with_trashed'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $query = $includeTrashed
            ? User::with(self::WITH_LIST)->withTrashed()
            : User::with(self::WITH_LIST)->withoutTrashed();

        $this->applyFilters($query, $filters);

        $sort      = $filters['sort']      ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';

        $allowedSorts = [
            'first_name', 'last_name', 'email',
            'employee_number', 'joining_date', 'status', 'created_at',
        ];

        if (in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        }

        return $query->paginate((int) ($filters['per_page'] ?? 10));
    }

    // -----------------------------------------------------------------------
    // Find by primary key
    // -----------------------------------------------------------------------

    /**
     * Find a user with all detail relationships or throw 404.
     */
    public function findById(int $id): User
    {
        return User::with(self::WITH_DETAIL)->findOrFail($id);
    }

    // -----------------------------------------------------------------------
    // HR: create user
    // -----------------------------------------------------------------------

    /**
     * Create a user, hashing the password and optionally storing a photo.
     * Automatically initializes the employee's single common leave balance (20 days).
     * Dispatches Welcome Employee Email notification.
     *
     * @param  array<string, mixed>  $data  Validated input from StoreUserRequest.
     */
    public function create(array $data): User
    {
        if (isset($data['manager_id'])) {
            $this->validateManagerHierarchy(null, $data['manager_id'] ? (int) $data['manager_id'] : null);
        }

        $rawPassword = (string) ($data['password'] ?? '');

        return DB::transaction(function () use ($data, $rawPassword): User {
            $data['password']              = Hash::make($data['password']);
            $data['force_password_change'] = $data['force_password_change'] ?? true;

            if (isset($data['profile_photo']) && $data['profile_photo'] instanceof UploadedFile) {
                $data['profile_photo'] = $data['profile_photo']->store('profile-photos', 'public');
            }

            $user = User::create($data);

            // Initialize common leave balance for current year
            $this->leaveBalanceService->getOrCreate($user->id);

            $recipientEmail = $user->personal_email ?: $user->email;

            try {
                Mail::to($recipientEmail)->send(new WelcomeEmployeeMail($user, $rawPassword));
            } catch (\Throwable $e) {
                report($e);
            }

            return $user->load(self::WITH_DETAIL);
        });
    }

    /**
     * Update a user by ID.
     *
     * @param  array<string, mixed>  $data  Validated input from UpdateUserRequest.
     */
    public function update(int $id, array $data): User
    {
        if (array_key_exists('manager_id', $data)) {
            $this->validateManagerHierarchy($id, $data['manager_id'] ? (int) $data['manager_id'] : null);
        }

        return DB::transaction(function () use ($id, $data): User {
            $user = User::findOrFail($id);

            if (isset($data['profile_photo']) && $data['profile_photo'] instanceof UploadedFile) {
                $this->deleteOldPhoto($user);
                $data['profile_photo'] = $data['profile_photo']->store('profile-photos', 'public');
            }

            $user->update($data);

            return $user->load(self::WITH_DETAIL);
        });
    }

    /**
     * Validate that setting a proposed manager_id does not cause a circular reporting dependency.
     *
     * @param int|null $userId ID of user being created or updated
     * @param int|null $proposedManagerId Proposed manager user ID
     * @throws DomainException if a cycle or self-reporting is detected
     */
    public function validateManagerHierarchy(?int $userId, ?int $proposedManagerId): void
    {
        if (!$proposedManagerId) {
            return;
        }

        if ($userId && (int) $userId === (int) $proposedManagerId) {
            throw new DomainException(
                'An employee cannot be assigned as their own manager.',
                'CIRCULAR_MANAGER_DEPENDENCY',
                422
            );
        }

        if (!$userId) {
            return;
        }

        $visited = [(int) $userId];
        $currentManagerId = (int) $proposedManagerId;

        while ($currentManagerId !== null && $currentManagerId > 0) {
            if (in_array($currentManagerId, $visited, true)) {
                throw new DomainException(
                    'Circular management dependency detected. An employee cannot report to someone who directly or indirectly reports to them.',
                    'CIRCULAR_MANAGER_DEPENDENCY',
                    422
                );
            }
            $visited[] = $currentManagerId;

            $manager = User::find($currentManagerId);
            $currentManagerId = $manager?->manager_id ? (int) $manager->manager_id : null;
        }
    }

    // -----------------------------------------------------------------------
    // HR: soft-delete
    // -----------------------------------------------------------------------

    /**
     * Soft-delete a user by ID.
     *
     * Also removes this user as manager from all reporting employees.
     *
     * @throws DomainException if the actor tries to delete their own account.
     */
    public function delete(int $id): void
    {
        /** @var User $actor */
        $actor = JWTAuth::user();

        if ($actor->id === $id) {
            throw DomainException::forbidden('You cannot delete your own account.');
        }

        DB::transaction(function () use ($id): void {
            $user = User::findOrFail($id);

            // Remove deleted user as manager from employees
            User::where('manager_id', $user->id)
                ->update([
                    'manager_id' => null,
                ]);

            // Soft delete the user
            $user->delete();
        });
    }

    // -----------------------------------------------------------------------
    // Self: own profile
    // -----------------------------------------------------------------------

    /**
     * Return the currently authenticated user with all detail relationships.
     */
    public function profile(): User
    {
        /** @var User $user */
        $user = JWTAuth::user();

        return $user->load(self::WITH_DETAIL);
    }

    // -----------------------------------------------------------------------
    // Self: update own personal profile (Employee / Manager)
    // -----------------------------------------------------------------------

    /**
     * Update only personal fields for the authenticated user.
     *
     * Company fields (email, role, department, etc.) are stripped even if
     * they arrive in $data — defence-in-depth on top of the FormRequest.
     *
     * @param  array<string, mixed>  $data  Validated input from UpdateProfileRequest.
     */
    public function updateProfile(array $data): User
    {
        /** @var User $user */
        $user = JWTAuth::user();

        return DB::transaction(function () use ($user, $data): User {
            $allowed = [
                'first_name', 'last_name',
                'personal_email', 'phone', 'gender', 'dob',
                'blood_group', 'address', 'emergency_contact', 'profile_photo',
            ];

            $safe = array_intersect_key($data, array_flip($allowed));

            if (isset($safe['gender']) && is_string($safe['gender'])) {
                $safe['gender'] = strtolower($safe['gender']);
            }

            if (isset($safe['profile_photo']) && $safe['profile_photo'] instanceof UploadedFile) {
                $this->deleteOldPhoto($user);
                $safe['profile_photo'] = $safe['profile_photo']->store('profile-photos', 'public');
            }

            $user->update($safe);

            return $user->load(self::WITH_DETAIL);
        });
    }

    // -----------------------------------------------------------------------
    // Manager: direct reports
    // -----------------------------------------------------------------------

    /**
     * Paginated list of users who report directly to the authenticated manager.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<User>
     */
    public function directReports(array $filters): LengthAwarePaginator
    {
        /** @var User $manager */
        $manager = JWTAuth::user();

        $query = User::with(self::WITH_LIST)
            ->where('manager_id', $manager->id)
            ->withoutTrashed();

        $this->applyFilters($query, $filters);

        return $query->orderBy('first_name')
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    // -----------------------------------------------------------------------
    // HR: role-filtered lists
    // -----------------------------------------------------------------------

    /**
     * Paginated list of users whose role name is "Manager".
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<User>
     */
    public function managers(array $filters): LengthAwarePaginator
    {
        return $this->paginateByRole('Manager', $filters);
    }

    /**
     * Paginated list of users whose role name is "Employee" or "Manager".
     * Managers are employees with additional permissions, so they appear here too.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<User>
     */
    public function employees(array $filters): LengthAwarePaginator
    {
        $query = User::with(self::WITH_LIST)
            ->withoutTrashed()
            ->whereHas('role', fn (Builder $q) => $q->whereIn('name', ['Employee', 'Manager']));

        $this->applyFilters($query, $filters);

        return $query->orderBy('first_name')->paginate((int) ($filters['per_page'] ?? 10));
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Paginate users filtered by role name.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<User>
     */
    private function paginateByRole(string $roleName, array $filters): LengthAwarePaginator
    {
        $query = User::with(self::WITH_LIST)
            ->withoutTrashed()
            ->whereHas('role', fn (Builder $q) => $q->where('name', $roleName));

        $this->applyFilters($query, $filters);

        return $query->orderBy('first_name')
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    /**
     * Apply search, status, department, role, and employment-type filters.
     *
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function (Builder $q) use ($term): void {
                $q->where('first_name', 'like', $term)
                  ->orWhere('last_name', 'like', $term)
                  ->orWhere('email', 'like', $term)
                  ->orWhere('employee_number', 'like', $term);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['department_id'])) {
            $query->where('department_id', (int) $filters['department_id']);
        }

        if (! empty($filters['role_id'])) {
            $query->where('role_id', (int) $filters['role_id']);
        }

        if (! empty($filters['role'])) {
            $query->whereHas('role', fn (Builder $q) => $q->where('name', $filters['role']));
        }

        if (! empty($filters['employment_type'])) {
            $query->where('employment_type', $filters['employment_type']);
        }

        if (! empty($filters['grade_job_title_id'])) {
            $query->where('grade_job_title_id', (int) $filters['grade_job_title_id']);
        }

        if (! empty($filters['manager_id'])) {
            $query->where('manager_id', (int) $filters['manager_id']);
        }
    }

    /**
     * Delete the user's existing profile photo from storage.
     */
    private function deleteOldPhoto(User $user): void
    {
        if ($user->profile_photo) {
            Storage::disk('public')->delete($user->profile_photo);
        }
    }

    /**
     * Restore a soft deleted user.
     */
    public function restore(int $id): User
    {
        return DB::transaction(function () use ($id): User {
            $user = User::onlyTrashed()
                ->findOrFail($id);

            $user->restore();

            return $user->load(self::WITH_DETAIL);
        });
    }
}
