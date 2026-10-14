<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreGradeRequest;
use App\Http\Requests\Master\UpdateGradeRequest;
use App\Http\Resources\Master\GradeResource;
use App\Services\Grade\GradeService;
use Illuminate\Http\JsonResponse;

/**
 * Class GradeController
 *
 * Handles HTTP requests related to grade management.
 *
 * Responsibilities:
 * - Provides endpoints for retrieving grades.
 * - Handles grade creation, modification, and deletion requests.
 * - Delegates business rules and data operations to GradeService.
 *
 * Authorization:
 * - Read operations are available to authenticated users.
 * - Write operations should be restricted to HR users through route middleware.
 */
class GradeController extends Controller
{
    /**
     * GradeController constructor.
     *
     * @param GradeService $service Service responsible for grade business operations.
     */
    public function __construct(
        private readonly GradeService $service,
    ) {
    }

    /**
     * Retrieve all grades.
     *
     * Grades are returned using a resource collection to ensure
     * consistent API response formatting.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return $this->success(
            GradeResource::collection($this->service->all())
        );
    }

    /**
     * Retrieve a specific grade by identifier.
     *
     * @param int $id Grade identifier.
     *
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        return $this->success(
            new GradeResource($this->service->findById($id))
        );
    }

    /**
     * Create a new grade.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param StoreGradeRequest $request Validated grade creation request.
     *
     * @return JsonResponse
     */
    public function store(StoreGradeRequest $request): JsonResponse
    {
        $grade = $this->service->create(
            $request->validated()
        );

        return $this->success(
            new GradeResource($grade),
            'Grade created successfully.',
            201
        );
    }

    /**
     * Update an existing grade.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param UpdateGradeRequest $request Validated grade update request.
     * @param int $id Grade identifier.
     *
     * @return JsonResponse
     */
    public function update(
        UpdateGradeRequest $request,
        int $id
    ): JsonResponse {
        $grade = $this->service->update(
            $id,
            $request->validated()
        );

        return $this->success(
            new GradeResource($grade),
            'Grade updated successfully.'
        );
    }

    /**
     * Delete an existing grade.
     *
     * Business restrictions, such as preventing deletion of grades
     * referenced by grade_job_titles, should be handled inside the service layer.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param int $id Grade identifier.
     *
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->success(
            message: 'Grade deleted successfully.'
        );
    }
}