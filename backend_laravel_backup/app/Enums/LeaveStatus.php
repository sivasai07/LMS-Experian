<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enum representing the lifecycle status of a leave request.
 *
 * Defines the available workflow states for leave requests:
 *
 * - Pending: Awaiting approval or rejection.
 * - Approved: Accepted and applied to the employee's leave balance.
 * - Rejected: Declined and does not affect the leave balance.
 * - Cancelled: Previously approved leave that has been cancelled.
 *
 * The workflow is tracked through processed_by, processed_at,
 * cancelled_by, and cancelled_at fields on the leave request record.
 */
enum LeaveStatus: string
{
    /**
     * Leave request awaiting review.
     */
    case Pending = 'pending';

    /**
     * Leave request approved by an authorized user.
     */
    case Approved = 'approved';

    /**
     * Leave request rejected by an authorized user.
     */
    case Rejected = 'rejected';

    /**
     * Previously approved leave request that has been cancelled.
     */
    case Cancelled = 'cancelled';

    /**
     * Get a human-readable label for the leave status.
     *
     * @return string The formatted leave status label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Cancelled => 'Cancelled',
        };
    }

    /**
     * Determine whether this status affects the employee's leave balance.
     *
     * Only approved leave requests consume leave balance.
     * Cancelled requests are considered reversed.
     *
     * @return bool True when the status impacts leave balance.
     */
    public function affectsBalance(): bool
    {
        return $this === self::Approved;
    }
}