<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\User\UserListResource;
use App\Http\Resources\User\UserResource;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Class UserController
 *
 * Handles user management operations.
 *
 * Responsibilities:
 * - Provides user listing and retrieval endpoints.
 * - Handles user creation, updating, deletion, and restoration.
 * - Delegates business logic and persistence operations to UserService.
 *
 * Authorization:
 * - Access control should be enforced through route middleware
 *   and authorization policies.
 * - User restoration should only be available to authorized HR users.
 */
class UserController extends Controller
{
    /**
     * UserController constructor.
     *
     * @param UserService $service Service responsible for user operations.
     */
    public function __construct(
        private readonly UserService $service
    ) {
    }

    /**
     * Retrieve paginated users.
     *
     * Supports filtering and pagination through query parameters.
     *
     * Route:
     * GET /api/v1/users
     *
     * @param Request $request HTTP request containing query filters.
     *
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->service->paginate(
            $request->query()
        );

        return $this->paginatedSuccess(
            UserListResource::collection($paginator),
            $paginator
        );
    }

    /**
     * Retrieve a single user by identifier.
     *
     * Route:
     * GET /api/v1/users/{id}
     *
     * @param int $id User identifier.
     *
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        return $this->success(
            new UserResource($this->service->findById($id))
        );
    }

    /**
     * Create a new user.
     *
     * Route:
     * POST /api/v1/users
     *
     * @param StoreUserRequest $request Validated user creation request.
     *
     * @return JsonResponse
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->service->create(
            $request->validated()
        );

        return $this->success(
            new UserResource($user),
            'User created successfully.',
            201
        );
    }

    /**
     * Update an existing user.
     *
     * Route:
     * PUT /api/v1/users/{id}
     *
     * @param UpdateUserRequest $request Validated user update request.
     * @param int $id User identifier.
     *
     * @return JsonResponse
     */
    public function update(
        UpdateUserRequest $request,
        int $id
    ): JsonResponse {
        $user = $this->service->update(
            $id,
            $request->validated()
        );

        return $this->success(
            new UserResource($user),
            'User updated successfully.'
        );
    }

    /**
     * Delete a user.
     *
     * Deletion rules, including soft delete handling,
     * should be managed inside UserService.
     *
     * Route:
     * DELETE /api/v1/users/{id}
     *
     * @param int $id User identifier.
     *
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->success(
            message: 'User deleted successfully.'
        );
    }

    /**
     * Restore a soft-deleted user account.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * Route:
     * POST /api/v1/users/{id}/restore
     *
     * @param int $id User identifier.
     *
     * @return JsonResponse
     */
    public function restore(int $id): JsonResponse
    {
        return $this->success(
            new UserResource($this->service->restore($id)),
            'User restored successfully.'
        );
    }
}