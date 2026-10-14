<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\LeaveBalance;
use App\Models\User;
use App\Services\Leave\LeaveAllocationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveAllocationServiceTest extends TestCase
{
    use RefreshDatabase;

    private LeaveAllocationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new LeaveAllocationService();
    }

    public function test_previous_year_joiner_gets_full_annual_allocation(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'joining_date' => '2025-01-15',
        ]);

        $allocation = $this->service->calculateAnnualAllocation($user, 2026);

        // Full annual allocation = 20.0
        $this->assertEquals(20.0, $allocation);
    }

    public function test_employee_joining_first_of_july_proration(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'joining_date' => '2026-07-01',
        ]);

        // July..Dec (6 months * 1.67 = 10.0)
        $allocation = $this->service->calculateAnnualAllocation($user, 2026);

        $this->assertEquals(10.0, $allocation);
    }

    public function test_employee_joining_end_of_july_gets_less_than_first_of_july(): void
    {
        /** @var User $user1 */
        $user1 = User::factory()->create(['joining_date' => '2026-07-01']);
        /** @var User $user2 */
        $user2 = User::factory()->create(['joining_date' => '2026-07-31']);

        $alloc1 = $this->service->calculateAnnualAllocation($user1, 2026);
        $alloc2 = $this->service->calculateAnnualAllocation($user2, 2026);

        $this->assertGreaterThan($alloc2, $alloc1);
    }

    public function test_carry_forward_capped_at_max_5_days(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        LeaveBalance::create([
            'user_id'   => $user->id,
            'year'      => 2025,
            'allocated' => 20.0,
            'used'      => 8.0,
            'balance'   => 12.0, // 12 unused days
        ]);

        $carryForward = $this->service->calculateCarryForward($user, 2026);

        // Max carry forward allowed is 5 days
        $this->assertEquals(5.0, $carryForward);
    }

    public function test_carry_forward_when_unused_balance_is_less_than_5(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        LeaveBalance::create([
            'user_id'   => $user->id,
            'year'      => 2025,
            'allocated' => 20.0,
            'used'      => 17.5,
            'balance'   => 2.5, // 2.5 unused days
        ]);

        $carryForward = $this->service->calculateCarryForward($user, 2026);

        $this->assertEquals(2.5, $carryForward);
    }
}
