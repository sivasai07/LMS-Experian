<?php

declare(strict_types=1);

namespace App\Http\Resources\Master;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class DepartmentResource
 *
 * Handles transformation of department data for API responses.
 *
 * Responsibilities:
 * - Formats department information returned to API consumers.
 * - Controls the fields exposed from the department model.
 * - Provides consistent timestamp formatting.
 *
 * Design:
 * - Department business logic remains within the service/domain layer.
 * - This resource is responsible only for API response formatting.
 */
class DepartmentResource extends JsonResource
{
    /**
     * Transform the department resource into an array.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}