<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\Auth\TokenResource;
use App\Http\Resources\Auth\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;

/**
 * Controller responsible for JWT authentication endpoints.
 *
 * This controller follows a thin-controller approach:
 * - Handles HTTP request input.
 * - Delegates authentication logic to AuthService.
 * - Returns API resources and standardized responses.
 *
 * Business rules and authentication workflows remain inside AuthService.
 */
class AuthController extends Controller
{
    /**
     * Create a new authentication controller instance.
     *
     * @param AuthService $authService Authentication service instance.
     */
    public function __construct(
        private readonly AuthService $authService,
    ) {
    }

    /**
     * Authenticate a user and generate JWT token.
     *
     * Endpoint: POST /api/v1/auth/login
     *
     * @param LoginRequest $request Validated login request.
     *
     * @return JsonResponse Authentication response.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $this->authService->login($request->validated());

        return $this->success([
            'token' => $payload['token'],
            'token_type' => $payload['token_type'],
            'expires_in' => $payload['expires_in'],
            'force_password_change' => $payload['force_password_change'],
            'user' => new UserResource($payload['user']),
        ]);
    }

    /**
     * Logout the currently authenticated user.
     *
     * Endpoint: POST /api/v1/auth/logout
     *
     * @return JsonResponse Logout response.
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return $this->success(
            message: 'Successfully logged out.',
        );
    }

    /**
     * Refresh the current authentication token.
     *
     * Endpoint: POST /api/v1/auth/refresh
     *
     * @return JsonResponse Token refresh response.
     */
    public function refresh(): JsonResponse
    {
        return $this->success(
            new TokenResource($this->authService->refresh()),
        );
    }

    /**
     * Retrieve the currently authenticated user.
     *
     * Endpoint: GET /api/v1/auth/me
     *
     * @return JsonResponse Current user response.
     */
    public function me(): JsonResponse
    {
        return $this->success(
            new UserResource($this->authService->me()),
        );
    }

    /**
     * Change the authenticated user's password.
     *
     * Endpoint: POST /api/v1/auth/change-password
     *
     * @param ChangePasswordRequest $request Validated password change request.
     *
     * @return JsonResponse Password change response.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $payload = $this->authService->changePassword(
            $request->validated('current_password'),
            $request->validated('password'),
        );

        return $this->success(
            new TokenResource($payload),
            'Password changed successfully.',
        );
    }
}