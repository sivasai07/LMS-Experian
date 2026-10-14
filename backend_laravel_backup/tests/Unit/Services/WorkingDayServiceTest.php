<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\Leave\WorkingDayService;
use Carbon\Carbon;
use Tests\TestCase;

class WorkingDayServiceTest extends TestCase
{
    private WorkingDayService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new WorkingDayService();
    }

    public function test_full_week_excluding_weekend(): void
    {
        // Mon 03 Aug 2026 to Fri 07 Aug 2026 = 5 working days
        $start = Carbon::parse('2026-08-03');
        $end   = Carbon::parse('2026-08-07');
        $holidays = collect([]);

        $days = $this->service->calculate($start, $end, $holidays);

        $this->assertEquals(5.0, $days);
    }

    public function test_date_range_spanning_weekend(): void
    {
        // Fri 07 Aug 2026 to Mon 10 Aug 2026 (spanning Sat 08 and Sun 09) = 2 working days
        $start = Carbon::parse('2026-08-07');
        $end   = Carbon::parse('2026-08-10');
        $holidays = collect([]);

        $days = $this->service->calculate($start, $end, $holidays);

        $this->assertEquals(2.0, $days);
    }

    public function test_edge_case_friday_second_half_to_monday_first_half(): void
    {
        // 07 Aug (Second Half) + 08 Aug (Sat) + 09 Aug (Sun) + 10 Aug (First Half)
        // Expected: 0.5 + 0 + 0 + 0.5 = 1.0 Day
        $start = Carbon::parse('2026-08-07');
        $end   = Carbon::parse('2026-08-10');
        $holidays = collect([]);

        $days = $this->service->calculate(
            $start,
            $end,
            $holidays,
            startHalfDay: 'second_half',
            endHalfDay: 'first_half'
        );

        $this->assertEquals(1.0, $days);
    }

    public function test_company_holiday_exclusion(): void
    {
        // Mon 03 Aug to Wed 05 Aug with Tue 04 Aug being a company holiday = 2 working days
        $start = Carbon::parse('2026-08-03');
        $end   = Carbon::parse('2026-08-05');
        $holidays = collect(['2026-08-04']);

        $days = $this->service->calculate($start, $end, $holidays);

        $this->assertEquals(2.0, $days);
    }

    public function test_single_day_half_day_on_weekend_returns_zero(): void
    {
        // Sat 08 Aug half day
        $start = Carbon::parse('2026-08-08');
        $end   = Carbon::parse('2026-08-08');
        $holidays = collect([]);

        $days = $this->service->calculate($start, $end, $holidays, startHalfDay: 'first_half');

        $this->assertEquals(0.0, $days);
    }

    public function test_single_day_spans_full_day_with_halves(): void
    {
        $start = Carbon::parse('2026-08-07');
        $end   = Carbon::parse('2026-08-07');
        $holidays = collect([]);

        $days = $this->service->calculate(
            $start,
            $end,
            $holidays,
            startHalfDay: 'first_half',
            endHalfDay: 'second_half'
        );

        $this->assertEquals(1.0, $days);
    }

    public function test_single_day_same_half(): void
    {
        $start = Carbon::parse('2026-08-07');
        $end   = Carbon::parse('2026-08-07');
        $holidays = collect([]);

        $days = $this->service->calculate(
            $start,
            $end,
            $holidays,
            startHalfDay: 'first_half',
            endHalfDay: 'first_half'
        );

        $this->assertEquals(0.5, $days);
    }

    public function test_single_day_invalid_half_combination_throws_exception(): void
    {
        $start = Carbon::parse('2026-08-07');
        $end   = Carbon::parse('2026-08-07');
        $holidays = collect([]);

        $this->expectException(\App\Exceptions\DomainException::class);
        $this->expectExceptionMessage('Invalid half-day combination');

        $this->service->calculate(
            $start,
            $end,
            $holidays,
            startHalfDay: 'second_half',
            endHalfDay: 'first_half'
        );
    }
}
