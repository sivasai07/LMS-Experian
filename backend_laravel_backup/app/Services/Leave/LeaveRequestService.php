<?php

declare(strict_types=1);

namespace App\Services\Leave;

use App\Enums\LeaveStatus;
use App\Exceptions\DomainException;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class LeaveRequestService
{
    private const WITH_DETAIL = ['employee.department', 'leaveType', 'processor', 'canceller'];
    private const WITH_LIST   = ['employee.department', 'leaveType', 'processor', 'canceller'];

    public function __construct(
        private readonly WorkingDayService $workingDayService,
        private readonly HolidayService $holidayService,
        private readonly LeaveBalanceService $balanceService,
    ) {
    }

    /**
     * Employee: apply for leave.
     */
    public function apply(array $data): LeaveRequest
    {
        /** @var User $employee */
        $employee = JWTAuth::user();

        $leaveType = LeaveType::findOrFail($data['leave_type_id']);

        $startDate    = Carbon::parse($data['start_date']);
        $endDate      = Carbon::parse($data['end_date']);
        $isHalfDay        = (bool) ($data['is_half_day'] ?? false);
        $halfDayType      = $data['half_day_type'] ?? null;
        $hasExplicitRange = isset($data['start_half_day']) || isset($data['end_half_day']);

        $startHalfDay = $data['start_half_day'] ?? ($isHalfDay ? $halfDayType : null);
        $endHalfDay   = $data['end_half_day']   ?? ($isHalfDay ? $halfDayType : null);

        $hasHalfDay = $isHalfDay || $startHalfDay !== null || $endHalfDay !== null;

        // Half-day validation
        if ($hasHalfDay && !$leaveType->half_day_allowed) {
            throw new DomainException('This leave type does not allow half-day applications.', 'HALF_DAY_NOT_ALLOWED', 422);
        }
        if ($isHalfDay && !$hasExplicitRange && !$startDate->eq($endDate)) {
            throw new DomainException('Half-day leave must have the same start and end date.', 'HALF_DAY_DATE_MISMATCH', 422);
        }

        // Calculate working days
        $year         = (int) $startDate->year;
        $holidayDates = $this->holidayService->getHolidayDatesForYear($year);

        $workingDays = $this->workingDayService->calculate(
            $startDate,
            $endDate,
            $holidayDates,
            $startHalfDay,
            $endHalfDay
        );

        if ($workingDays <= 0) {
            throw new DomainException('The selected date range contains no working days.', 'NO_WORKING_DAYS', 422);
        }

        if ($workingDays > 5) {
            throw new DomainException('Maximum consecutive leave allowed is 5 working days. You cannot apply for more than 5 days of leave.', 'MAX_LEAVE_EXCEEDED', 422);
        }

        // Overlap check — pending or approved requests in same date range
        $sStr = $startDate->toDateString();
        $eStr = $endDate->toDateString();
        $overlappingRequests = LeaveRequest::where('employee_id', $employee->id)
            ->whereIn('status', [
                LeaveStatus::Pending->value,
                LeaveStatus::Approved->value,
                'pending',
                'approved',
            ])
            ->whereDate('start_date', '<=', $eStr)
            ->whereDate('end_date', '>=', $sStr)
            ->get();


foreach ($overlappingRequests as $existing) {

    $existingStart = Carbon::parse($existing->start_date);
    $existingEnd   = Carbon::parse($existing->end_date);

    $overlapStart = $startDate->greaterThan($existingStart)
        ? $startDate->copy()
        : $existingStart->copy();

    $overlapEnd = $endDate->lessThan($existingEnd)
        ? $endDate->copy()
        : $existingEnd->copy();


    for ($date = $overlapStart->copy(); $date->lte($overlapEnd); $date->addDay()) {

        /**
         * Existing leave half-day information
         */
        $existingHalf = null;

        if ($existingStart->isSameDay($existingEnd)) {

            $existingHalf =
                $existing->start_half_day?->value
                ?? $existing->half_day_type?->value;

        } elseif ($date->isSameDay($existingStart)) {

            $existingHalf = $existing->start_half_day?->value;

        } elseif ($date->isSameDay($existingEnd)) {

            $existingHalf = $existing->end_half_day?->value;
        }


        /**
         * New leave half-day information
         */
        $newHalf = null;

        if ($startDate->isSameDay($endDate)) {

            $newHalf = $startHalfDay;

        } elseif ($date->isSameDay($startDate)) {

            $newHalf = $startHalfDay;

        } elseif ($date->isSameDay($endDate)) {

            $newHalf = $endHalfDay;
        }


        /**
         * Conflict rules:
         *
         * Full day + anything = conflict
         * Same half + same date = conflict
         * Opposite halves = allowed
         */
        if ($existingHalf === null || $newHalf === null) {
            throw new DomainException(
                'You already have a leave request overlapping these dates.',
                'OVERLAPPING_LEAVE',
                422
            );
        }


        if ($existingHalf === $newHalf) {
            throw new DomainException(
                'You already have a leave request overlapping these dates.',
                'OVERLAPPING_LEAVE',
                422
            );
        }
    }
}

        return DB::transaction(function () use ($employee, $data, $leaveType, $workingDays, $hasHalfDay, $startHalfDay, $endHalfDay): LeaveRequest {
            $year    = (int) Carbon::parse($data['start_date'])->year;
            $balance = $this->balanceService->getOrCreate($employee->id, $year);

            // Deduct working days immediately upon applying
            $this->balanceService->deduct(
                $balance,
                (float) $workingDays,
                (float) config('leave.max_negative_balance', 5.0)
            );

            $leaveRequest = LeaveRequest::create([
                'employee_id'    => $employee->id,
                'leave_type_id'  => $leaveType->id,
                'start_date'     => $data['start_date'],
                'end_date'       => $data['end_date'],
                'working_days'   => $workingDays,
                'is_half_day'    => $hasHalfDay,
                'half_day_type'  => $startHalfDay ?? ($data['half_day_type'] ?? null),
                'start_half_day' => $startHalfDay,
                'end_half_day'   => $endHalfDay,
                'reason'         => $data['reason'],
                'status'         => LeaveStatus::Pending->value,
                'is_active'      => true,
            ]);

            return $leaveRequest->load(self::WITH_DETAIL);
        });
    }

    /**
     * Get authenticated user's own leave history (paginated).
     */
    public function myLeaves(array $filters): LengthAwarePaginator
    {
        /** @var User $user */
        $user = JWTAuth::user();

        $query = LeaveRequest::with(self::WITH_LIST)
            ->where('employee_id', $user->id);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    /**
     * Get a single leave request (with access check).
     */
    public function findById(int $id): LeaveRequest
    {
        /** @var User $actor */
        $actor    = JWTAuth::user();
        $roleName = $actor->role?->name ?? '';

        $leaveRequest = LeaveRequest::with(self::WITH_DETAIL)->findOrFail($id);

        // Employees can only see their own
        if ($roleName === 'Employee' && $leaveRequest->employee_id !== $actor->id) {
            throw DomainException::forbidden();
        }
        // Managers can see their own + direct reports
        if ($roleName === 'Manager') {
            $isOwn    = $leaveRequest->employee_id === $actor->id;
            $isDirect = $leaveRequest->employee?->manager_id === $actor->id;
            if (!$isOwn && !$isDirect) {
                throw DomainException::forbidden();
            }
        }

        return $leaveRequest;
    }

    /**
     * Cancel a leave request.
     */
    public function cancel(int $id, string $reason): LeaveRequest
    {
        /** @var User $actor */
        $actor = JWTAuth::user();

        $leaveRequest = LeaveRequest::with(self::WITH_DETAIL)->findOrFail($id);

        // Only the employee who owns it can cancel
        if ($leaveRequest->employee_id !== $actor->id) {
            throw DomainException::forbidden('You can only cancel your own leave requests.');
        }

        if ($leaveRequest->status !== LeaveStatus::Pending) {
            throw new DomainException('Only pending leaves can be cancelled.', 'INVALID_STATUS_TRANSITION', 422);
        }

        return DB::transaction(function () use ($leaveRequest, $actor, $reason): LeaveRequest {
            $year    = (int) Carbon::parse($leaveRequest->start_date)->year;
            $balance = $this->balanceService->getOrCreate($leaveRequest->employee_id, $year);

            // Restore deducted working days back to common leave balance upon cancellation
            $this->balanceService->restore($balance, (float) $leaveRequest->working_days);

            $leaveRequest->update([
                'status'              => LeaveStatus::Cancelled->value,
                'is_active'           => false,
                'cancelled_by'        => $actor->id,
                'cancelled_at'        => now(),
                'cancellation_reason' => $reason,
            ]);

            return $leaveRequest->refresh()->load(self::WITH_DETAIL);
        });
    }

    /**
     * Get pending leave requests (Manager sees team direct reports, HR sees all).
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator
     */
    public function pendingLeaves(array $filters): LengthAwarePaginator
    {
        /** @var User $actor */
        $actor    = JWTAuth::user();
        $roleName = $actor->role?->name ?? '';

        $query = LeaveRequest::with(self::WITH_LIST);

        // Default to pending if no status filter provided
        $statusFilter = $filters['status'] ?? LeaveStatus::Pending->value;
        if (!empty($statusFilter)) {
            $query->where('status', $statusFilter);
        }

        // Scope Team Leaves: Managers see direct reports; HR sees direct reports + employees with manager_id == null
        $reportIds = $actor->directReports()->pluck('id')->toArray();

        if (in_array($roleName, ['HR', 'Admin', 'Super Admin'], true)) {
            $query->where(function (Builder $q) use ($reportIds): void {
                if (!empty($reportIds)) {
                    $q->whereIn('employee_id', $reportIds)
                      ->orWhereHas('employee', fn (Builder $sub) => $sub->whereNull('manager_id'));
                } else {
                    $q->whereHas('employee', fn (Builder $sub) => $sub->whereNull('manager_id'));
                }
            });
        } else {
            $query->whereIn('employee_id', $reportIds);
        }

        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->whereHas('employee', function (Builder $q) use ($term): void {
                $q->where('first_name', 'like', $term)
                  ->orWhere('last_name', 'like', $term)
                  ->orWhere('employee_number', 'like', $term);
            });
        }

        return $query->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    /**
     * Get all leave requests with filters (HR only).
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator
     */
    public function allLeaves(array $filters): LengthAwarePaginator
    {
        $query = LeaveRequest::with([...(self::WITH_LIST), 'employee.role']);

        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->whereHas('employee', function (Builder $q) use ($term): void {
                $q->where('first_name', 'like', $term)
                  ->orWhere('last_name', 'like', $term)
                  ->orWhere('employee_number', 'like', $term);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['leave_type_id'])) {
            $query->where('leave_type_id', (int) $filters['leave_type_id']);
        }

        if (!empty($filters['department_id'])) {
            $query->whereHas('employee', fn (Builder $q) => $q->where('department_id', (int) $filters['department_id']));
        }

        if (!empty($filters['manager_id'])) {
            $query->whereHas('employee', fn (Builder $q) => $q->where('manager_id', (int) $filters['manager_id']));
        }

        if (!empty($filters['from_date'])) {
            $query->where('start_date', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->where('end_date', '<=', $filters['to_date']);
        }

        $sort      = $filters['sort']      ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';
        $allowed   = ['created_at', 'start_date', 'end_date', 'status', 'working_days'];
        if (in_array($sort, $allowed, true)) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        }

        return $query->paginate((int) ($filters['per_page'] ?? 10));
    }

    /**
     * Approve a pending leave request (Manager or HR).
     * Deducts working days from the employee's single common leave balance.
     *
     * @param  int          $id
     * @param  string|null  $remarks
     * @return LeaveRequest
     *
     * @throws DomainException if status is not pending or user lacks authorization.
     */
    public function approve(int $id, ?string $remarks): LeaveRequest
    {
        /** @var User $actor */
        $actor = JWTAuth::user();

        $leaveRequest = LeaveRequest::with(self::WITH_DETAIL)->findOrFail($id);

        if ($leaveRequest->status !== LeaveStatus::Pending) {
            throw new DomainException('Only pending leaves can be approved.', 'INVALID_STATUS_TRANSITION', 422);
        }

        $employeeManagerId = $leaveRequest->employee?->manager_id;
        $actor->loadMissing('role');
        $actorIsHr = $actor->role?->name === 'HR';

        // Authorization is ownership-based, not role-based: the assigned
        // manager can always approve their own report's leave, regardless
        // of what role that manager holds (a role=Employee person can
        // still be someone's manager_id). HR is the one explicit bypass,
        // matching "HR has full access to all leave records."
        if (! $actorIsHr && (! $employeeManagerId || $employeeManagerId !== $actor->id)) {
            throw DomainException::forbidden(
                'Only the assigned manager or HR can approve this leave request.'
            );
        }

        return DB::transaction(function () use ($leaveRequest, $actor, $remarks): LeaveRequest {
            // Days were already deducted upon leave application; update status to Approved
            $leaveRequest->update([
                'status'       => LeaveStatus::Approved->value,
                'processed_by' => $actor->id,
                'processed_at' => now(),
                'remarks'      => $remarks,
            ]);

            return $leaveRequest->refresh()->load(self::WITH_DETAIL);
        });
    }

    /**
     * Reject a pending leave request (Manager or HR).
     * Does NOT deduct any leave balance.
     *
     * @param  int          $id
     * @param  string|null  $remarks
     * @return LeaveRequest
     *
     * @throws DomainException if status is not pending or user lacks authorization.
     */
    public function reject(int $id, ?string $remarks): LeaveRequest
    {
        /** @var User $actor */
        $actor = JWTAuth::user();

        $leaveRequest = LeaveRequest::with(self::WITH_DETAIL)->findOrFail($id);

        if ($leaveRequest->status !== LeaveStatus::Pending) {
            throw new DomainException('Only pending leaves can be rejected.', 'INVALID_STATUS_TRANSITION', 422);
        }

        $employeeManagerId = $leaveRequest->employee?->manager_id;
        $actor->loadMissing('role');
        $actorIsHr = $actor->role?->name === 'HR';

        if (! $actorIsHr && (! $employeeManagerId || $employeeManagerId !== $actor->id)) {
            throw DomainException::forbidden(
                'Only the assigned manager or HR can reject this leave request.'
            );
        }

        return DB::transaction(function () use ($leaveRequest, $actor, $remarks): LeaveRequest {
            $year    = (int) Carbon::parse($leaveRequest->start_date)->year;
            $balance = $this->balanceService->getOrCreate($leaveRequest->employee_id, $year);

            // Restore deducted working days back to common leave balance upon rejection
            $this->balanceService->restore($balance, (float) $leaveRequest->working_days);

            $leaveRequest->update([
                'status'       => LeaveStatus::Rejected->value,
                'is_active'    => false,
                'processed_by' => $actor->id,
                'processed_at' => now(),
                'remarks'      => $remarks,
            ]);

            return $leaveRequest->refresh()->load(self::WITH_DETAIL);
        });
    }
}
