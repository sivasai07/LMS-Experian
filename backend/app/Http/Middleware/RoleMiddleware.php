<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class RoleMiddleware
 *
 * Restricts access to application routes based on the authenticated
 * user's assigned role.
 *
 * Responsibilities:
 * - Validates that an authenticated user exists.
 * - Loads the user's role relationship when required.
 * - Ensures the user has one of the permitted roles.
 *
 * Security:
 * - Role information is always retrieved from the database.
 * - JWT claims are intentionally not trusted for authorization decisions.
 * - Role changes become effective on the next authenticated request
 *   without requiring token regeneration.
 *
 * Usage:
 * middleware('role:HR')
 * middleware('role:HR,Manager')
 */
class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Verifies that the authenticated user has permission to access
     * the requested route based on their role name.
     *
     * @param Request $request Incoming HTTP request.
     * @param Closure $next Next middleware handler.
     * @param string ...$roles Allowed role names.
     *
     * @throws AuthorizationException When authentication or authorization fails.
     *
     * @return Response
     */
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles
    ): Response {
        /** @var User|null $user */
        $user = $request->user('api');

        if (! $user) {
            throw new AuthorizationException(
                'Unauthenticated.'
            );
        }

        // Prevent unnecessary database queries if the relationship
        // has already been eager-loaded earlier in the request lifecycle.
        $user->loadMissing('role');

        if (! in_array($user->role?->name, $roles, true)) {
            throw new AuthorizationException(
                'Forbidden.'
            );
        }

        return $next($request);
    }
}