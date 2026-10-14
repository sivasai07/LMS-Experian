<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreDepartmentRequest;
use App\Http\Requests\Master\UpdateDepartmentRequest;
use App\Http\Resources\Master\DepartmentResource;
use App\Services\Department\DepartmentService;
use Illuminate\Http\JsonResponse;

/**
 * Class DepartmentController
 *
 * Handles HTTP requests related to department management.
 *
 * Responsibilities:
 * - Provides department listing and retrieval endpoints.
 * - Handles department creation, updating, and deletion.
 * - Delegates business logic execution to DepartmentService.
 *
 * Authorization:
 * - Read operations are available to authenticated users.
 * - Write operations should be protected through route middleware
 *   and limited to authorized HR personnel.
 */
class DepartmentController extends Controller
{
    /**
     * DepartmentController constructor.
     *
     * @param DepartmentService $service Service responsible for department business logic.
     */
    public function __construct(
        private readonly DepartmentService $service,
    ) {
    }

    /**
     * Retrieve all departments.
     *
     * Departments are returned through a resource collection to maintain
     * a consistent API response structure.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return $this->success(
            DepartmentResource::collection($this->service->all())
        );
    }

    /**
     * Retrieve a single department by identifier.
     *
     * @param int $id Department identifier.
     *
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        return $this->success(
            new DepartmentResource($this->service->findById($id))
        );
    }

    /**
     * Create a new department.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param StoreDepartmentRequest $request Validated department creation request.
     *
     * @return JsonResponse
     */
    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = $this->service->create($request->validated());

        return $this->success(
            new DepartmentResource($department),
            'Department created successfully.',
            201
        );
    }

    /**
     * Update an existing department.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param UpdateDepartmentRequest $request Validated department update request.
     * @param int $id Department identifier.
     *
     * @return JsonResponse
     */
    public function update(
        UpdateDepartmentRequest $request,
        int $id
    ): JsonResponse {
        $department = $this->service->update(
            $id,
            $request->validated()
        );

        return $this->success(
            new DepartmentResource($department),
            'Department updated successfully.'
        );
    }

    /**
     * Delete an existing department.
     *
     * Deletion rules such as preventing deletion of departments
     * assigned to users should be handled inside the service layer.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param int $id Department identifier.
     *
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->success(
            message: 'Department deleted successfully.'
        );
    }
}