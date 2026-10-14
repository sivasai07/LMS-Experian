<?php

declare(strict_types=1);

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class HolidayResource
 *
 * Handles transformation of holiday data for API responses.
 *
 * Responsibilities:
 * - Formats holiday information returned to API consumers.
 * - Provides consistent date and timestamp formatting.
 * - Controls the fields exposed from the holiday model.
 *
 * Design:
 * - Business logic remains within the service layer.
 * - This resource is responsible only for response transformation.
 */
class HolidayResource extends JsonResource
{
    /**
     * Transform the holiday resource into an array.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'holiday_name' => $this->holiday_name,
            'holiday_date' => $this->holiday_date?->format('Y-m-d'),
            'description' => $this->description,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}