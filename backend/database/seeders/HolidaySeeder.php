<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Holiday;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class HolidaySeeder extends Seeder
{
    /**
     * Seeds a sample set of holidays for the current year. Dates are
     * built off the current year rather than hardcoded so re-seeding
     * next year doesn't silently leave stale dates in place.
     */
    public function run(): void
    {
        $year = Carbon::now()->year;

        $holidays = [
            ['holiday_name' => "New Year's Day", 'holiday_date' => "{$year}-01-01"],
            ['holiday_name' => 'Republic Day', 'holiday_date' => "{$year}-01-26"],
            ['holiday_name' => 'Independence Day', 'holiday_date' => "{$year}-08-15"],
            ['holiday_name' => 'Gandhi Jayanti', 'holiday_date' => "{$year}-10-02"],
            ['holiday_name' => 'Diwali', 'holiday_date' => "{$year}-10-20"],
            ['holiday_name' => 'Christmas Day', 'holiday_date' => "{$year}-12-25"],
        ];

        foreach ($holidays as $holiday) {
            Holiday::query()->firstOrCreate(
                ['holiday_name' => $holiday['holiday_name'], 'holiday_date' => $holiday['holiday_date']],
                $holiday
            );
        }
    }
}
