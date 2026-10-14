<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Resources\User\UserResource;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;

/**
 * Class ProfileController
 *
 * Handles profile operations for the currently authenticated user.
 *
 * Responsibilities:
 * - Provides access to the authenticated user's profile information.
 * - Handles updates to permitted personal profile fields.
 * - Delegates profile-related business logic to UserService.
 *
 * Authorization:
 * - Users can only view and update their own profile.
 * - Field-level restrictions should be enforced through request validation
 *   and service-layer business rules.
 */
class ProfileController extends Controller
{
    /**
     * ProfileController constructor.
     *
     * @param UserService $service Service responsible for user profile operations.
     */
    public function __construct(
        private readonly UserService $service
    ) {
    }

    /**
     * Display the authenticated user's profile.
     *
     * Returns the profile data of the currently logged-in user.
     *
     * Route:
     * GET /api/v1/users/profile
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        return $this->success(
            new UserResource($this->service->profile())
        );
    }

    /**
     * Update the authenticated user's profile.
     *
     * Only permitted profile fields defined within UpdateProfileRequest
     * should be updated.
     *
     * Route:
     * PUT /api/v1/users/profile
     *
     * @param UpdateProfileRequest $request Validated profile update request.
     *
     * @return JsonResponse
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->service->updateProfile(
            $request->validated()
        );

        return $this->success(
            new UserResource($user),
            'Profile updated successfully.'
        );
    }
}