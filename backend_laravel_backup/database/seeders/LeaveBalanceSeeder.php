<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\LeaveBalance;
use App\Models\User;
use App\Services\Leave\LeaveAllocationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Seeder for Employee Common Leave Balances.
 *
 * Creates one leave_balances row per user for the current calendar year.
 * Allocations are prorated based on each user's Date of Joining.
 */
class LeaveBalanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $year = (int) Carbon::now()->year;
        $allocationService = new LeaveAllocationService();

        User::query()->each(function (User $user) use ($year, $allocationService): void {
            $allocated = $allocationService->calculateTotalOpeningAllocation($user, $year);

            LeaveBalance::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'year'    => $year,
                ],
                [
                    'allocated' => $allocated,
                    'used'      => 0.00,
                    'balance'   => $allocated,
                ]
            );
        });
    }
}
