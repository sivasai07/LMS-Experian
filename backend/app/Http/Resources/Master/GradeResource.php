<?php

declare(strict_types=1);

namespace App\Http\Resources\Master;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class GradeResource
 *
 * Handles transformation of grade data for API responses.
 *
 * Responsibilities:
 * - Formats grade information returned to API consumers.
 * - Controls the fields exposed from the grade model.
 * - Provides consistent timestamp formatting.
 *
 * Design:
 * - Grade business logic remains within the service/domain layer.
 * - This resource is responsible only for API response formatting.
 */
class GradeResource extends JsonResource
{
    /**
     * Transform the grade resource into an array.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'description' => $this->description,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}