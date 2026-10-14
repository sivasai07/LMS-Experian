<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\User\UserListResource;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Class TeamController
 *
 * Handles team-related user listing operations.
 *
 * Responsibilities:
 * - Provides endpoints for retrieving team member lists.
 * - Supports manager and HR-related user visibility operations.
 * - Delegates filtering and retrieval logic to UserService.
 *
 * Authorization:
 * - Direct reports are accessible by managers.
 * - Manager and employee listings should be restricted through
 *   route middleware and authorization policies.
 */
class TeamController extends Controller
{
    /**
     * TeamController constructor.
     *
     * @param UserService $service Service responsible for user-related operations.
     */
    public function __construct(
        private readonly UserService $service
    ) {
    }

    /**
     * Retrieve users reporting directly to the authenticated manager.
     *
     * Route:
     * GET /api/v1/users/direct-reports
     *
     * @param Request $request HTTP request containing filter parameters.
     *
     * @return JsonResponse
     */
    public function directReports(Request $request): JsonResponse
    {
        $paginator = $this->service->directReports(
            $request->query()
        );

        return $this->paginatedSuccess(
            UserListResource::collection($paginator),
            $paginator
        );
    }

    /**
     * Retrieve users with manager roles.
     *
     * Route:
     * GET /api/v1/users/managers
     *
     * @param Request $request HTTP request containing filter parameters.
     *
     * @return JsonResponse
     */
    public function managers(Request $request): JsonResponse
    {
        $paginator = $this->service->managers(
            $request->query()
        );

        return $this->paginatedSuccess(
            UserListResource::collection($paginator),
            $paginator
        );
    }

    /**
     * Retrieve employee users.
     *
     * Route:
     * GET /api/v1/users/employees
     *
     * @param Request $request HTTP request containing filter parameters.
     *
     * @return JsonResponse
     */
    public function employees(Request $request): JsonResponse
    {
        $paginator = $this->service->employees(
            $request->query()
        );

        return $this->paginatedSuccess(
            UserListResource::collection($paginator),
            $paginator
        );
    }
}