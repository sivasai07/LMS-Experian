<?php

declare(strict_types=1);

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class TokenResource
 *
 * Handles transformation of authentication token responses.
 *
 * Responsibilities:
 * - Formats JWT token information for API responses.
 * - Provides a consistent structure for token-related payloads.
 *
 * Design:
 * - Token generation and authentication logic remain inside the service layer.
 * - This resource is responsible only for response formatting.
 */
class TokenResource extends JsonResource
{
    /**
     * Transform the token payload into an array.
     *
     * Response fields:
     * - token: Generated authentication token.
     * - token_type: Authentication scheme identifier.
     * - expires_in: Token expiration duration.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'token' => $this->resource['token'],
            'token_type' => $this->resource['token_type'],
            'expires_in' => $this->resource['expires_in'],
        ];
    }
}