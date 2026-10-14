<?php

declare(strict_types=1);

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class LoginResource
 *
 * Handles transformation of authentication responses.
 *
 * Responsibilities:
 * - Formats JWT authentication metadata.
 * - Includes authenticated user profile information.
 * - Provides a consistent API response structure for login operations.
 *
 * Design:
 * - Authentication business logic remains inside AuthService.
 * - This resource is responsible only for response transformation.
 */
class LoginResource extends JsonResource
{
    /**
     * Transform the authentication response into an array.
     *
     * Includes:
     * - Access token information.
     * - Token expiry metadata.
     * - Password change requirement flag.
     * - Authenticated user details.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'token' => $this['token'],
            'token_type' => $this['token_type'],
            'expires_in' => $this['expires_in'],
            'force_password_change' => $this['force_password_change'],
            'user' => $this['user'],
        ];
    }
}