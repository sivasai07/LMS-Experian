<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Leave;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreHolidayRequest;
use App\Http\Requests\Leave\UpdateHolidayRequest;
use App\Http\Resources\Leave\HolidayResource;
use App\Services\Leave\HolidayService;
use Illuminate\Http\JsonResponse;

/**
 * Controller responsible for managing holiday records.
 *
 * Delegates all business operations to HolidayService and handles only
 * HTTP request processing and API resource transformation.
 */
class HolidayController extends Controller
{
    /**
     * Create a new holiday controller instance.
     *
     * @param HolidayService $service Holiday service instance.
     */
    public function __construct(
        private readonly HolidayService $service,
    ) {
    }

    /**
     * Retrieve all holidays.
     *
     * Endpoint: GET /api/v1/holidays
     *
     * @return JsonResponse Holiday collection response.
     */
    public function index(): JsonResponse
    {
        return $this->success(
            HolidayResource::collection($this->service->all()),
        );
    }

    /**
     * Retrieve a single holiday by identifier.
     *
     * Endpoint: GET /api/v1/holidays/{id}
     *
     * @param int $id Holiday identifier.
     *
     * @return JsonResponse Holiday response.
     */
    public function show(int $id): JsonResponse
    {
        return $this->success(
            new HolidayResource($this->service->findById($id)),
        );
    }

    /**
     * Create a new holiday record.
     *
     * Endpoint: POST /api/v1/holidays
     *
     * @param StoreHolidayRequest $request Validated holiday creation request.
     *
     * @return JsonResponse Created holiday response.
     */
    public function store(StoreHolidayRequest $request): JsonResponse
    {
        $holiday = $this->service->create($request->validated());

        return $this->success(
            new HolidayResource($holiday),
            'Holiday created successfully.',
            201,
        );
    }

    /**
     * Update an existing holiday record.
     *
     * Endpoint: PUT/PATCH /api/v1/holidays/{id}
     *
     * @param UpdateHolidayRequest $request Validated holiday update request.
     * @param int $id Holiday identifier.
     *
     * @return JsonResponse Updated holiday response.
     */
    public function update(UpdateHolidayRequest $request, int $id): JsonResponse
    {
        $updated = $this->service->update(
            $id,
            $request->validated(),
        );

        return $this->success(
            new HolidayResource($updated),
            'Holiday updated successfully.',
        );
    }

    /**
     * Delete a holiday record.
     *
     * Endpoint: DELETE /api/v1/holidays/{id}
     *
     * @param int $id Holiday identifier.
     *
     * @return JsonResponse Delete confirmation response.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return self::success(
            message: 'Holiday deleted successfully.',
        );
    }
}