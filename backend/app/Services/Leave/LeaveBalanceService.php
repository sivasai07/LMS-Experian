<?php

declare(strict_types=1);

namespace App\Services\Leave;

use App\Exceptions\DomainException;
use App\Models\LeaveBalance;
use App\Models\User;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Service: LeaveBalanceService
 *
 * Encapsulates single common leave balance management logic.
 * Every employee has ONLY ONE common leave balance per calendar year (20 days).
 * Maximum negative balance allowed is -5 days.
 */
class LeaveBalanceService
{
    private int $currentYear;

    public function __construct(
        private ?LeaveAllocationService $allocationService = null
    ) {
        $this->currentYear = (int) now()->year;
        $this->allocationService ??= new LeaveAllocationService();
    }

    /**
     * Get or create the common leave balance for the authenticated user (current year).
     *
     * @return LeaveBalance
     */
    public function myBalances(): LeaveBalance
    {
        /** @var User $user */
        $user = JWTAuth::user();

        return $this->getOrCreate($user->id, $this->currentYear);
    }

    /**
     * Get or create the common leave balance for a specific user.
     *
     * @param  int       $userId
     * @param  int|null  $year
     * @return LeaveBalance
     */
    public function balancesForUser(int $userId, ?int $year = null): LeaveBalance
    {
        return $this->getOrCreate($userId, $year ?? $this->currentYear);
    }

    /**
     * Get or automatically create the single common leave balance record for a user + year.
     * Calculated dynamically based on Date of Joining and previous year carry-forward rules.
     *
     * @param  int        $userId
     * @param  int|null   $year
     * @param  float|null $overrideAllocation
     * @return LeaveBalance
     */
    public function getOrCreate(int $userId, ?int $year = null, ?float $overrideAllocation = null): LeaveBalance
    {
        $targetYear = $year ?? $this->currentYear;

        $existing = LeaveBalance::where('user_id', $userId)
            ->where('year', $targetYear)
            ->first();

        if ($existing) {
            return $existing;
        }

        $allocation = $overrideAllocation;

        if ($allocation === null) {
            $user = User::find($userId);
            if ($user && $this->allocationService) {
                $allocation = $this->allocationService->calculateTotalOpeningAllocation($user, $targetYear);
            } else {
                $allocation = 20.0;
            }
        }

        return LeaveBalance::create([
            'user_id'   => $userId,
            'year'      => $targetYear,
            'allocated' => $allocation,
            'used'      => 0.00,
            'balance'   => $allocation,
        ]);
    }

    /**
     * Deduct working days from common balance upon leave approval.
     * Enforces the maximum allowed negative balance (-5 days).
     *
     * @param  LeaveBalance  $balance
     * @param  float         $days
     * @param  float         $negativeLimit Default 5.0 (allows balance down to -5.0)
     * @return void
     *
     * @throws DomainException if deduction would exceed maximum allowed negative balance.
     */
    public function deduct(LeaveBalance $balance, float $days, float $negativeLimit = 5.0): void
    {
        if (($balance->balance - $days) < -$negativeLimit) {
            throw new DomainException(
                "Insufficient leave balance. Current balance is {$balance->balance} days. Request requires {$days} days, exceeding the maximum allowed negative balance limit of -{$negativeLimit} days.",
                'INSUFFICIENT_BALANCE',
                422
            );
        }

        $balance->used    = (float) $balance->used + $days;
        $balance->balance = (float) $balance->balance - $days;
        $balance->save();
    }

    /**
     * Restore working days to common balance upon cancellation or rejection of a leave request.
     *
     * @param  LeaveBalance  $balance
     * @param  float         $days
     * @return void
     */
    public function restore(LeaveBalance $balance, float $days): void
    {
        $balance->used    = max(0.0, (float) $balance->used - $days);
        $balance->balance = (float) $balance->balance + $days;
        $balance->save();
    }
}
