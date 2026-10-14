<?php

declare(strict_types=1);

namespace App\Services\Leave;

use App\Models\LeaveBalance;
use App\Models\User;
use Carbon\Carbon;

/**
 * Service: LeaveAllocationService
 *
 * Encapsulates annual leave allocation calculations based on Date of Joining
 * and yearly carry-forward business rules.
 *
 * Business Rules:
 * - Annual entitlement = 20 days / year (1.67 days / month).
 * - Allocation for new hires is dynamically prorated based on joining month in the calendar year.
 *   Example: Joined in July -> 6 months remaining (July..Dec) -> 10 days allocated.
 * - Max carry-forward of unused leave days to a new year is 5 days.
 */
class LeaveAllocationService
{
    public const DEFAULT_ANNUAL_ALLOCATION = 20.0;
    public const MAX_CARRY_FORWARD          = 5.0;

    /**
     * Calculate base prorated annual leave allocation for a user in a specific calendar year
     * based on their Date of Joining.
     *
     * @param  User  $user
     * @param  int   $year
     * @return float
     */
    public function calculateAnnualAllocation(User $user, int $year): float
    {
        $annualTarget = (float) config('leave.annual_allocation', self::DEFAULT_ANNUAL_ALLOCATION);
        $monthlyRate  = $annualTarget / 12.0;

        if (!$user->joining_date) {
            return $annualTarget;
        }

        $joiningDate = Carbon::parse($user->joining_date);
        $joiningYear = (int) $joiningDate->year;

        // Joined in a previous year -> Full annual allocation (20 days)
        if ($joiningYear < $year) {
            return $annualTarget;
        }

        // Joined after target year -> 0 allocation
        if ($joiningYear > $year) {
            return 0.0;
        }

        // Joined during target year -> Prorate for remaining months with day precision
        $joiningMonth         = (int) $joiningDate->month;
        $daysInMonth          = (int) $joiningDate->daysInMonth;
        $remainingDaysInMonth = $daysInMonth - (int) $joiningDate->day + 1;
        $monthFraction        = $remainingDaysInMonth / $daysInMonth;
        $remainingMonths      = (12 - $joiningMonth) + $monthFraction;

        return round($remainingMonths * $monthlyRate, 1);
    }

    /**
     * Calculate carry forward days from the previous calendar year.
     *
     * @param  User  $user
     * @param  int   $year
     * @return float
     */
    public function calculateCarryForward(User $user, int $year): float
    {
        $previousYearBalance = LeaveBalance::where('user_id', $user->id)
            ->where('year', $year - 1)
            ->first();

        if (!$previousYearBalance) {
            return 0.0;
        }

        $unusedBalance   = (float) $previousYearBalance->balance;
        $maxCarryForward = (float) config('leave.max_carry_forward', self::MAX_CARRY_FORWARD);

        return min($maxCarryForward, max(0.0, $unusedBalance));
    }

    /**
     * Calculate total initial allocation (New Allocation + Carry Forward) for a given year.
     *
     * @param  User  $user
     * @param  int   $year
     * @return float
     */
    public function calculateTotalOpeningAllocation(User $user, int $year): float
    {
        $newAllocation = $this->calculateAnnualAllocation($user, $year);
        $carryForward  = $this->calculateCarryForward($user, $year);

        return round($newAllocation + $carryForward, 1);
    }
}
