<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Master;

use App\Http\Controllers\Controller;
use App\Http\Resources\Master\GradeJobTitleResource;
use App\Services\GradeJobTitle\GradeJobTitleService;
use Illuminate\Http\JsonResponse;

/**
 * Read-only endpoint for grade/job-title combinations.
 * Used by HR when creating or editing employees.
 *
 * GET /api/v1/grade-job-titles
 */
class GradeJobTitleController extends Controller
{
    public function __construct(
        private readonly GradeJobTitleService $service,
    ) {}

    /**
     * Return all valid grade–job-title combinations.
     */
    public function index(): JsonResponse
    {
        return $this->success(
            GradeJobTitleResource::collection(
                $this->service->getAll()
            )
        );
    }
}
