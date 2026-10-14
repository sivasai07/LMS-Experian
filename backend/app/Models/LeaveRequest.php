<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\HalfDayType;
use App\Enums\LeaveStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class LeaveRequest
 *
 * Represents an employee leave application and its approval workflow.
 *
 * Responsibilities:
 * - Stores employee leave application details.
 * - Tracks approval, rejection, and cancellation workflow information.
 * - Defines relationships with employee, leave type, processor, and canceller users.
 * - Provides attribute casting for dates, enums, and boolean values.
 *
 * Design:
 * - This model handles database representation, casting, and relationships only.
 * - Leave validation, balance calculation, and workflow decisions remain within
 *   the service/domain layer.
 *
 * Relationship Notes:
 * - The model contains three separate User relationships because the table
 *   references users through different foreign keys:
 *   employee_id, processed_by, and cancelled_by.
 * - Explicit foreign keys are required because Eloquent cannot infer which
 *   user relationship each column represents.
 */
class LeaveRequest extends Model
{
    use HasFactory;

    /**
     * Attributes that can be mass assigned.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'working_days',
        'is_half_day',
        'half_day_type',
        'start_half_day',
        'end_half_day',
        'reason',
        'status',
        'processed_by',
        'processed_at',
        'remarks',
        'cancelled_by',
        'cancelled_at',
        'cancellation_reason',
        'is_active',
    ];

    /**
     * Get attribute casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'working_days' => 'decimal:1',
            'is_half_day' => 'boolean',
            'is_active' => 'boolean',
            'processed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'half_day_type' => HalfDayType::class,
            'start_half_day' => HalfDayType::class,
            'end_half_day' => HalfDayType::class,
            'status' => LeaveStatus::class,
        ];
    }

    /**
     * Get the employee who submitted this leave request.
     *
     * @return BelongsTo<User, LeaveRequest>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Get the leave type associated with this request.
     *
     * @return BelongsTo<LeaveType, LeaveRequest>
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * Get the user who processed this leave request.
     *
     * Represents the manager or HR user who approved or rejected the request.
     * This remains null while the request is pending.
     *
     * @return BelongsTo<User, LeaveRequest>
     */
    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Get the user who cancelled this leave request.
     *
     * Returns the cancelling user when a cancellation has occurred.
     *
     * @return BelongsTo<User, LeaveRequest>
     */
    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}