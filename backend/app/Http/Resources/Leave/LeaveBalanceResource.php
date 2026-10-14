<?php

declare(strict_types=1);

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class LeaveBalanceResource
 *
 * Handles transformation of employee leave balance data.
 *
 * Responsibilities:
 * - Formats leave balance information for API responses.
 * - Ensures numeric leave values are returned consistently.
 * - Controls the fields exposed from the leave balance model.
 *
 * Design:
 * - Leave calculation logic remains within the service/domain layer.
 * - This resource is responsible only for API response formatting.
 */
class LeaveBalanceResource extends JsonResource
{
    /**
     * Transform the leave balance resource into an array.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'year' => $this->year,
            'allocated' => (float) $this->allocated,
            'used' => (float) $this->used,
            'balance' => (float) $this->balance,
        ];
    }
}