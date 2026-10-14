<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Leave;

use App\Http\Controllers\Controller;
use App\Services\Leave\DashboardService;
use Illuminate\Http\JsonResponse;

/**
 * Controller responsible for leave dashboard endpoints.
 *
 * Delegates dashboard data retrieval to DashboardService and
 * returns standardized JSON responses.
 *
 * No business logic is handled within this controller.
 */
class DashboardController extends Controller
{
    /**
     * Create a new dashboard controller instance.
     *
     * @param DashboardService $service Dashboard data service instance.
     */
    public function __construct(
        private readonly DashboardService $service,
    ) {
    }

    /**
     * Retrieve employee dashboard data.
     *
     * Endpoint: GET /api/v1/dashboard/employee
     *
     * @return JsonResponse Employee dashboard response.
     */
    public function employee(): JsonResponse
    {
        return $this->success(
            $this->service->employee(),
        );
    }

    /**
     * Retrieve manager dashboard data.
     *
     * Endpoint: GET /api/v1/dashboard/manager
     *
     * @return JsonResponse Manager dashboard response.
     */
    public function manager(): JsonResponse
    {
        return $this->success(
            $this->service->manager(),
        );
    }

    /**
     * Retrieve HR dashboard data.
     *
     * Endpoint: GET /api/v1/dashboard/hr
     *
     * @return JsonResponse HR dashboard response.
     */
    public function hr(): JsonResponse
    {
        return $this->success(
            $this->service->hr(),
        );
    }
}