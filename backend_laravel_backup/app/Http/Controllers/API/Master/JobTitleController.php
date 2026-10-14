<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreJobTitleRequest;
use App\Http\Requests\Master\UpdateJobTitleRequest;
use App\Http\Resources\Master\JobTitleResource;
use App\Services\JobTitle\JobTitleService;
use Illuminate\Http\JsonResponse;

/**
 * Class JobTitleController
 *
 * Handles HTTP requests related to job title management.
 *
 * Responsibilities:
 * - Provides job title listing and retrieval endpoints.
 * - Handles job title creation, updating, and deletion requests.
 * - Delegates business operations to JobTitleService.
 *
 * Authorization:
 * - Read operations are available to authenticated users.
 * - Write operations should be restricted to HR users through route middleware.
 */
class JobTitleController extends Controller
{
    /**
     * JobTitleController constructor.
     *
     * @param JobTitleService $service Service responsible for job title operations.
     */
    public function __construct(
        private readonly JobTitleService $service,
    ) {
    }

    /**
     * Retrieve all job titles.
     *
     * Job titles are returned through a resource collection to maintain
     * a consistent API response format.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return $this->success(
            JobTitleResource::collection($this->service->all())
        );
    }

    /**
     * Retrieve a single job title by identifier.
     *
     * @param int $id Job title identifier.
     *
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        return $this->success(
            new JobTitleResource($this->service->findById($id))
        );
    }

    /**
     * Create a new job title.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param StoreJobTitleRequest $request Validated job title creation request.
     *
     * @return JsonResponse
     */
    public function store(StoreJobTitleRequest $request): JsonResponse
    {
        $jobTitle = $this->service->create(
            $request->validated()
        );

        return $this->success(
            new JobTitleResource($jobTitle),
            'Job title created successfully.',
            201
        );
    }

    /**
     * Update an existing job title.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param UpdateJobTitleRequest $request Validated job title update request.
     * @param int $id Job title identifier.
     *
     * @return JsonResponse
     */
    public function update(
        UpdateJobTitleRequest $request,
        int $id
    ): JsonResponse {
        $jobTitle = $this->service->update(
            $id,
            $request->validated()
        );

        return $this->success(
            new JobTitleResource($jobTitle),
            'Job title updated successfully.'
        );
    }

    /**
     * Delete an existing job title.
     *
     * Business restrictions, such as preventing deletion when the job title
     * is referenced in grade_job_titles, should be handled by JobTitleService.
     *
     * This operation should only be accessible by authorized HR users.
     *
     * @param int $id Job title identifier.
     *
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->success(
            message: 'Job title deleted successfully.'
        );
    }
}