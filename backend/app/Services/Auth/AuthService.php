<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Enums\UserStatus;
use App\Exceptions\AuthException;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Handles authentication business logic.
 *
 * Responsible for credential validation, JWT lifecycle management,
 * current user resolution, and password change workflows.
 *
 * Uses the api authentication guard for user resolution to support
 * both real JWT bearer authentication and Laravel test helpers.
 */
class AuthService
{
    /**
     * Authenticate user credentials and generate a JWT token.
     *
     * The force_password_change flag does not prevent authentication.
     * The client application is responsible for redirecting users to
     * update their password when required.
     *
     * @param array{email: string, password: string} $credentials
     *
     * @return array{
     *     token: string,
     *     token_type: string,
     *     expires_in: int,
     *     force_password_change: bool,
     *     user: User
     * }
     *
     * @throws AuthException
     */
    public function login(array $credentials): array
    {
        /** @var User|null $user */
        $user = User::with('role')
            ->where('email', $credentials['email'])
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw AuthException::invalidCredentials();
        }

        if ($user->status !== UserStatus::Active) {
            throw AuthException::accountInactive();
        }

        $token = JWTAuth::fromUser($user);

        return [
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => $this->ttlInSeconds(),
            'force_password_change' => (bool) $user->force_password_change,
            'user' => $user,
        ];
    }

    /**
     * Logout the current authenticated user.
     *
     * Invalidates the current JWT token.
     */
    public function logout(): void
    {
        try {
            $token = JWTAuth::getToken();

            if ($token) {
                JWTAuth::invalidate($token);
            }
        } catch (JWTException) {
            throw AuthException::unauthenticated();
        }
    }

    /**
     * Refresh the current JWT token.
     *
     * @return array{
     *     token: string,
     *     token_type: string,
     *     expires_in: int
     * }
     *
     * @throws AuthException
     */
    public function refresh(): array
    {
        $token = JWTAuth::getToken();

        if (! $token) {
            throw AuthException::unauthenticated();
        }

        try {
            $newToken = JWTAuth::refresh($token);
        } catch (JWTException) {
            throw AuthException::unauthenticated();
        }

        return [
            'token' => $newToken,
            'token_type' => 'bearer',
            'expires_in' => $this->ttlInSeconds(),
        ];
    }

    /**
     * Get the currently authenticated user.
     *
     * Loads the role relationship to ensure authorization-related
     * information is available without additional queries.
     *
     * @throws AuthException
     */
    public function me(): User
    {
        /** @var User|null $user */
        $user = auth('api')->user();

        if (! $user) {
            throw AuthException::unauthenticated();
        }

        $user->loadMissing('role');

        return $user;
    }

    /**
     * Change the current user's password.
     *
     * Verifies the existing password, updates credentials inside a
     * database transaction, invalidates the old token, and issues a
     * new JWT token.
     *
     * @return array{
     *     token: string,
     *     token_type: string,
     *     expires_in: int
     * }
     *
     * @throws AuthException
     */
    public function changePassword(string $currentPassword, string $newPassword): array
    {
        /** @var User|null $user */
        $user = auth('api')->user();

        if (! $user) {
            throw AuthException::unauthenticated();
        }

        if (! Hash::check($currentPassword, $user->password)) {
            throw AuthException::incorrectCurrentPassword();
        }

        DB::transaction(static function () use ($user, $newPassword): void {
            $user->update([
                'password' => Hash::make($newPassword),
                'force_password_change' => false,
            ]);
        });

        $oldToken = JWTAuth::getToken();

        if ($oldToken) {
            try {
                JWTAuth::invalidate($oldToken);
            } catch (JWTException) {
                // Ignore already invalid tokens during password rotation.
            }
        }

        /** @var User $freshUser */
        $freshUser = $user->fresh();

        $newToken = JWTAuth::fromUser($freshUser);

        return [
            'token' => $newToken,
            'token_type' => 'bearer',
            'expires_in' => $this->ttlInSeconds(),
        ];
    }

    /**
     * Get configured JWT expiry duration in seconds.
     */
    private function ttlInSeconds(): int
    {
        return (int) config('jwt.ttl') * 60;
    }
}