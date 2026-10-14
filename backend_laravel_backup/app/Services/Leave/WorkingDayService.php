<?php

declare(strict_types=1);

namespace App\Services\Leave;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

/**
 * Service: WorkingDayService
 *
 * Provides accurate working-day calculation for leave requests.
 * Accounts for inclusive date ranges, Saturday/Sunday exclusions,
 * company holiday exclusions, and half-day combinations (single day & ranges).
 */
class WorkingDayService
{
    /**
     * Calculate working days between two dates (inclusive),
     * excluding weekends and company holidays.
     *
     * @param  Carbon       $start
     * @param  Carbon       $end
     * @param  Collection   $holidayDates  List of holiday dates (YYYY-MM-DD).
     * @param  string|null  $startHalfDay  'first_half', 'second_half', or null (full day).
     * @param  string|null  $endHalfDay    'first_half', 'second_half', or null (full day).
     * @return float
     */
    public function calculate(
        Carbon $start,
        Carbon $end,
        Collection $holidayDates,
        ?string $startHalfDay = null,
        ?string $endHalfDay = null
    ): float {
        if ($start->gt($end)) {
            return 0.0;
        }

        // Single-day calculation
        if ($start->isSameDay($end)) {
            if (!$this->isWorkingDay($start, $holidayDates)) {
                return 0.0;
            }

            if ($startHalfDay !== null || $endHalfDay !== null) {
                if ($startHalfDay === 'first_half' && $endHalfDay === 'second_half') {
                    return 1.0;
                }
                if ($startHalfDay === 'second_half' && $endHalfDay === 'first_half') {
                    throw new \App\Exceptions\DomainException(
                        'Invalid half-day combination: start half-day cannot be second half when end half-day is first half on the same day.',
                        'INVALID_HALF_DAY_COMBINATION',
                        422
                    );
                }
                return 0.5;
            }

            return 1.0;
        }

        // Multi-day calculation
        $days = 0.0;
        $period = CarbonPeriod::create($start, $end);

        foreach ($period as $date) {
            if (!$this->isWorkingDay($date, $holidayDates)) {
                continue;
            }

            $isStart = $date->isSameDay($start);
            $isEnd   = $date->isSameDay($end);

            if ($isStart) {
                if ($startHalfDay === 'second_half') {
                    $days += 0.5;
                } else {
                    $days += 1.0;
                }
            } elseif ($isEnd) {
                if ($endHalfDay === 'first_half') {
                    $days += 0.5;
                } else {
                    $days += 1.0;
                }
            } else {
                $days += 1.0;
            }
        }

        return $days;
    }

    /**
     * Check whether a given date is a working day (not weekend and not holiday).
     *
     * @param  Carbon      $date
     * @param  Collection  $holidayDates
     * @return bool
     */
    public function isWorkingDay(Carbon $date, Collection $holidayDates): bool
    {
        return !$date->isWeekend() && !$holidayDates->contains($date->toDateString());
    }
}

