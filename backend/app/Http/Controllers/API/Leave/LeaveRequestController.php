<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Leave;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\ApplyLeaveRequest;
use App\Http\Requests\Leave\CancelLeaveRequest;
use App\Http\Requests\Leave\ProcessLeaveRequest;
use App\Http\Resources\Leave\LeaveRequestListResource;
use App\Http\Resources\Leave\LeaveRequestResource;
use App\Services\Leave\LeaveRequestService;
use Illuminate\Http\JsonResponse;

/**
 * Controller responsible for leave request lifecycle operations.
 *
 * Handles HTTP interactions for:
 * - Applying for leave.
 * - Viewing leave requests.
 * - Cancelling leave requests.
 * - Approving or rejecting requests.
 * - Retrieving personal and administrative listings.
 *
 * Business rules and workflow handling are delegated to LeaveRequestService.
 */
class LeaveRequestController extends Controller
{
    /**
     * Create a new leave request controller instance.
     *
     * @param LeaveRequestService $service Leave request service instance.
     */
    public function __construct(
        private readonly LeaveRequestService $service,
    ) {
    }

    /**
     * Submit a new leave request.
     *
     * Endpoint: POST /api/v1/leave-requests
     *
     * @param ApplyLeaveRequest $request Validated leave application request.
     *
     * @return JsonResponse Created leave request response.
     */
    public function apply(ApplyLeaveRequest $request): JsonResponse
    {
        $leave = $this->service->apply($request->validated());

        return $this->success(
            new LeaveRequestResource($leave),
            'Leave applied successfully.',
            201,
        );
    }

    /**
     * Retrieve authenticated user's leave request history.
     *
     * Endpoint: GET /api/v1/leave-requests/my
     *
     * @return JsonResponse Paginated leave request response.
     */
    public function my(): JsonResponse
    {
        $paginator = $this->service->myLeaves(
            request()->query(),
        );

        return $this->paginatedSuccess(
            LeaveRequestListResource::collection($paginator),
            $paginator,
        );
    }

    /**
     * Retrieve a single leave request.
     *
     * Endpoint: GET /api/v1/leave-requests/{id}
     *
     * Access control is handled inside LeaveRequestService.
     *
     * @param int $id Leave request identifier.
     *
     * @return JsonResponse Leave request response.
     */
    public function show(int $id): JsonResponse
    {
        return $this->success(
            new LeaveRequestResource(
                $this->service->findById($id),
            ),
        );
    }

    /**
     * Cancel an existing leave request.
     *
     * Endpoint: POST /api/v1/leave-requests/{id}/cancel
     *
     * @param CancelLeaveRequest $request Validated cancellation request.
     * @param int $id Leave request identifier.
     *
     * @return JsonResponse Cancelled leave request response.
     */
    public function cancel(
        CancelLeaveRequest $request,
        int $id,
    ): JsonResponse {
        $leave = $this->service->cancel(
            $id,
            $request->validated('cancellation_reason'),
        );

        return $this->success(
            new LeaveRequestResource($leave),
            'Leave cancelled successfully.',
        );
    }

    /**
     * Retrieve pending leave requests.
     *
     * HR users see all pending requests, while managers see
     * requests belonging to their team.
     *
     * Endpoint: GET /api/v1/leave-requests/pending
     *
     * @return JsonResponse Paginated pending leave requests response.
     */
    public function pending(): JsonResponse
    {
        $paginator = $this->service->pendingLeaves(
            request()->query(),
        );

        return $this->paginatedSuccess(
            LeaveRequestListResource::collection($paginator),
            $paginator,
        );
    }

    /**
     * Retrieve all leave requests.
     *
     * Intended for HR users with filtering support.
     *
     * Endpoint: GET /api/v1/leave-requests
     *
     * @return JsonResponse Paginated leave request response.
     */
    public function index(): JsonResponse
    {
        $paginator = $this->service->allLeaves(
            request()->query(),
        );

        return $this->paginatedSuccess(
            LeaveRequestListResource::collection($paginator),
            $paginator,
        );
    }

    /**
     * Approve a leave request.
     *
     * Endpoint: POST /api/v1/leave-requests/{id}/approve
     *
     * @param ProcessLeaveRequest $request Validated processing request.
     * @param int $id Leave request identifier.
     *
     * @return JsonResponse Approved leave request response.
     */
    public function approve(
        ProcessLeaveRequest $request,
        int $id,
    ): JsonResponse {
        $leave = $this->service->approve(
            $id,
            $request->validated('remarks'),
        );

        return $this->success(
            new LeaveRequestResource($leave),
            'Leave approved successfully.',
        );
    }

    /**
     * Reject a leave request.
     *
     * Endpoint: POST /api/v1/leave-requests/{id}/reject
     *
     * @param ProcessLeaveRequest $request Validated processing request.
     * @param int $id Leave request identifier.
     *
     * @return JsonResponse Rejected leave request response.
     */
    public function reject(
        ProcessLeaveRequest $request,
        int $id,
    ): JsonResponse {
        $leave = $this->service->reject(
            $id,
            $request->validated('remarks'),
        );

        return $this->success(
            new LeaveRequestResource($leave),
            'Leave rejected successfully.',
        );
    }
}