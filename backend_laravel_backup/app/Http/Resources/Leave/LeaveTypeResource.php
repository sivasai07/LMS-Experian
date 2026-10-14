<?php

declare(strict_types=1);

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class LeaveTypeResource
 *
 * Handles transformation of leave type data for API responses.
 *
 * Responsibilities:
 * - Formats leave type information returned to API consumers.
 * - Ensures numeric quota values are returned consistently.
 * - Controls the fields exposed from the leave type model.
 *
 * Design:
 * - Leave policy and quota calculation logic remain within the service/domain layer.
 * - This resource is responsible only for API response formatting.
 */
class LeaveTypeResource extends JsonResource
{
    /**
     * Transform the leave type resource into an array.
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
            'annual_quota' => (float) $this->annual_quota,
            'negative_limit' => (float) $this->negative_limit,
            'half_day_allowed' => $this->half_day_allowed,
            'description' => $this->description,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}