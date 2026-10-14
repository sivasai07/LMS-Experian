<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BloodGroup;
use App\Enums\EmploymentType;
use App\Enums\Gender;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

/**
 * Represents an employee record and the API authentication entity.
 *
 * Uses JWT-based stateless authentication through the API guard.
 *
 * Role handling:
 * - role_id defines application permissions (Employee, Manager, HR).
 * - manager_id defines organisational reporting hierarchy.
 *
 * A user's permission role and reporting structure are intentionally
 * separated. An employee role user can still manage direct reports
 * when assigned through the organisation hierarchy.
 *
 * @property int $id
 * @property string $employee_number
 * @property string $first_name
 * @property string $last_name
 * @property string $email
 * @property string|null $personal_email
 * @property string|null $phone
 * @property string|null $password
 * @property \Illuminate\Support\Carbon|null $dob
 * @property \Illuminate\Support\Carbon|null $joining_date
 * @property \Illuminate\Support\Carbon|null $relieving_date
 * @property int|null $role_id
 * @property int|null $department_id
 * @property int|null $grade_job_title_id
 * @property int|null $manager_id
 *
 * @property-read Role|null $role
 * @property-read Department|null $department
 * @property-read GradeJobTitle|null $gradeJobTitle
 * @property-read User|null $manager
 */
class User extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_number',
        'first_name',
        'last_name',
        'email',
        'personal_email',
        'phone',
        'password',
        'gender',
        'dob',
        'blood_group',
        'address',
        'emergency_contact',
        'profile_photo',
        'joining_date',
        'relieving_date',
        'status',
        'employment_type',
        'force_password_change',
        'role_id',
        'department_id',
        'grade_job_title_id',
        'manager_id',
    ];

    /**
     * Attributes excluded from API serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get attribute casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'joining_date' => 'date',
            'relieving_date' => 'date',
            'password' => 'hashed',
            'force_password_change' => 'boolean',
            'gender' => Gender::class,
            'blood_group' => BloodGroup::class,
            'status' => UserStatus::class,
            'employment_type' => EmploymentType::class,
        ];
    }

    /**
     * Get the identifier stored in the JWT subject claim.
     */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * Get additional JWT claims.
     *
     * Only lightweight information is included. Permission checks should
     * always read current database values to ensure role changes apply
     * immediately.
     *
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role?->name,
        ];
    }

    /**
     * Get the user's assigned permission role.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the user's department.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the assigned grade and job title combination.
     *
     * Access grade through:
     * $user->gradeJobTitle->grade
     *
     * Access job title through:
     * $user->gradeJobTitle->jobTitle
     */
    public function gradeJobTitle(): BelongsTo
    {
        return $this->belongsTo(GradeJobTitle::class);
    }

    /**
     * Get the user's direct manager.
     *
     * Returns null when the employee has no assigned manager.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'manager_id');
    }

    /**
     * Get employees reporting directly to this user.
     *
     * Used for manager team views and reporting structures.
     */
    public function directReports(): HasMany
    {
        return $this->hasMany(self::class, 'manager_id');
    }

    /**
     * Get leave requests submitted by this employee.
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'employee_id');
    }

    /**
     * Get leave requests processed by this user.
     *
     * Used when a manager or HR approves/rejects leave.
     */
    public function processedLeaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'processed_by');
    }

    /**
     * Get leave requests cancelled by this user.
     */
    public function cancelledLeaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'cancelled_by');
    }

    /**
     * Get annual leave balances assigned to this employee.
     */
    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }
}