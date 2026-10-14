<?php

declare(strict_types=1);

namespace App\Http\Resources\Master;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class JobTitleResource
 *
 * Handles transformation of job title data for API responses.
 *
 * Responsibilities:
 * - Formats job title information returned to API consumers.
 * - Controls the fields exposed from the job title model.
 * - Provides consistent timestamp formatting.
 *
 * Design:
 * - Job title business logic remains within the service/domain layer.
 * - This resource is responsible only for API response formatting.
 */
class JobTitleResource extends JsonResource
{
    /**
     * Transform the job title resource into an array.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}