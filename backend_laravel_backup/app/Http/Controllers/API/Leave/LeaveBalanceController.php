<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Leave;

use App\Http\Controllers\Controller;
use App\Http\Resources\Leave\LeaveBalanceResource;
use App\Models\User;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Controller responsible for retrieving employee leave balances.
 *
 * Delegates balance calculation and retrieval logic to LeaveBalanceService.
 * This controller only handles HTTP request processing and response formatting.
 */
class LeaveBalanceController extends Controller
{
    /**
     * Create a new leave balance controller instance.
     *
     * @param LeaveBalanceService $service Leave balance service instance.
     */
    public function __construct(
        private readonly LeaveBalanceService $service,
    ) {
    }

    /**
     * Retrieve the authenticated user's leave balance.
     *
     * Endpoint: GET /api/v1/leave-balances/my
     *
     * @return JsonResponse Authenticated user's leave balance response.
     */
    public function my(): JsonResponse
    {
        $year = request()->query('year')
            ? (int) request()->query('year')
            : null;

        /** @var User $user */
        $user = Auth::user();

        $balance = $this->service->balancesForUser(
            $user->id,
            $year,
        );

        return $this->success(
            new LeaveBalanceResource($balance),
        );
    }

    /**
     * Retrieve leave balance for a specific user.
     *
     * This endpoint is intended for privileged users such as HR.
     *
     * Endpoint: GET /api/v1/leave-balances/{id}
     *
     * @param int $id User identifier.
     *
     * @return JsonResponse User leave balance response.
     */
    public function forUser(int $id): JsonResponse
    {
        $year = request()->query('year')
            ? (int) request()->query('year')
            : null;

        $balance = $this->service->balancesForUser(
            $id,
            $year,
        );

        return $this->success(
            new LeaveBalanceResource($balance),
        );
    }
}