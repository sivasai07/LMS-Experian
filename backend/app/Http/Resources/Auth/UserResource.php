<?php

declare(strict_types=1);

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class UserResource
 *
 * Handles transformation of authenticated user data.
 *
 * Responsibilities:
 * - Exposes user information required by API consumers.
 * - Hides sensitive fields such as password and remember_token.
 * - Conditionally includes loaded relationships to prevent N+1 queries.
 *
 * Design:
 * - Database and authentication logic remain inside models/services.
 * - This resource is responsible only for API response formatting.
 */
class UserResource extends JsonResource
{
    /**
     * Transform the user resource into an array.
     *
     * Excludes:
     * - password
     * - remember_token
     * - deleted_at
     * - created_at
     * - updated_at
     *
     * The role relationship is included only when eager-loaded.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_number' => $this->employee_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'status' => $this->status?->value,
            'employment_type' => $this->employment_type?->value,
            'force_password_change' => $this->force_password_change,
            'joining_date' => $this->joining_date?->toDateString(),
            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role->id,
                'name' => $this->role->name,
            ]),
        ];
    }
}