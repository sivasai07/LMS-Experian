<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Leave;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveTypeRequest;
use App\Http\Requests\Leave\UpdateLeaveTypeRequest;
use App\Http\Resources\Leave\LeaveTypeResource;
use App\Services\Leave\LeaveTypeService;
use Illuminate\Http\JsonResponse;

/**
 * Controller responsible for managing leave type records.
 *
 * Delegates all business operations to LeaveTypeService and handles only
 * HTTP request processing and API resource transformation.
 */
class LeaveTypeController extends Controller
{
    /**
     * Create a new leave type controller instance.
     *
     * @param LeaveTypeService $service Leave type service instance.
     */
    public function __construct(
        private readonly LeaveTypeService $service,
    ) {
    }

    /**
     * Retrieve all leave types.
     *
     * Endpoint: GET /api/v1/leave-types
     *
     * @return JsonResponse Leave type collection response.
     */
    public function index(): JsonResponse
    {
        return $this->success(
            LeaveTypeResource::collection($this->service->all()),
        );
    }

    /**
     * Retrieve a single leave type by identifier.
     *
     * Endpoint: GET /api/v1/leave-types/{id}
     *
     * @param int $id Leave type identifier.
     *
     * @return JsonResponse Leave type response.
     */
    public function show(int $id): JsonResponse
    {
        return $this->success(
            new LeaveTypeResource($this->service->findById($id)),
        );
    }

    /**
     * Create a new leave type.
     *
     * Endpoint: POST /api/v1/leave-types
     *
     * @param StoreLeaveTypeRequest $request Validated leave type creation request.
     *
     * @return JsonResponse Created leave type response.
     */
    public function store(StoreLeaveTypeRequest $request): JsonResponse
    {
        $leaveType = $this->service->create(
            $request->validated(),
        );

        return $this->success(
            new LeaveTypeResource($leaveType),
            'Leave type created successfully.',
            201,
        );
    }

    /**
     * Update an existing leave type.
     *
     * Endpoint: PUT/PATCH /api/v1/leave-types/{id}
     *
     * @param UpdateLeaveTypeRequest $request Validated leave type update request.
     * @param int $id Leave type identifier.
     *
     * @return JsonResponse Updated leave type response.
     */
    public function update(
        UpdateLeaveTypeRequest $request,
        int $id,
    ): JsonResponse {
        $updated = $this->service->update(
            $id,
            $request->validated(),
        );

        return $this->success(
            new LeaveTypeResource($updated),
            'Leave type updated successfully.',
        );
    }

    /**
     * Delete a leave type.
     *
     * Endpoint: DELETE /api/v1/leave-types/{id}
     *
     * @param int $id Leave type identifier.
     *
     * @return JsonResponse Delete confirmation response.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->success(
            message: 'Leave type deleted successfully.',
        );
    }
}