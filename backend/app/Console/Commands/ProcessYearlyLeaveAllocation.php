<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Leave\LeaveAllocationService;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Console\Command;

/**
 * Command: ProcessYearlyLeaveAllocation
 *
 * Artisan command to automatically create or refresh single common leave balances
 * for all active employees for a given calendar year (defaulting to the current/next year).
 * Applies Date-of-Joining prorated allocations and carry-forward rules (max 5 days).
 */
class ProcessYearlyLeaveAllocation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leave:process-yearly-allocation {year? : The target calendar year (e.g. 2027)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process annual leave allocations and carry forward (max 5 days) for all active employees';

    /**
     * Execute the console command.
     */
    public function handle(LeaveBalanceService $balanceService, LeaveAllocationService $allocationService): int
    {
        $targetYear = (int) ($this->argument('year') ?? now()->year);

        $this->info("Processing yearly leave allocations for year {$targetYear}...");

        $users = User::where('status', 'active')->get();
        $count = 0;

        foreach ($users as $user) {
            $balance = $balanceService->getOrCreate($user->id, $targetYear);
            $count++;
        }

        $this->info("Successfully processed annual leave allocation for {$count} active employees.");

        return Command::SUCCESS;
    }
}
