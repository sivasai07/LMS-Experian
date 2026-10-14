<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenBlacklistedException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Central exception-to-JSON response mapper for API routes.
 *
 * Registers exception render callbacks used by Laravel's exception handler
 * configuration and converts application exceptions into a consistent API
 * response envelope:
 *
 * {
 *     "success": false,
 *     "message": "Error message",
 *     "errors": [],
 *     "code": "ERROR_CODE"
 * }
 *
 * Registration example:
 *
 * ->withExceptions(fn (Exceptions $exceptions) => Handler::register($exceptions))
 */
class Handler
{
    /**
     * Register custom exception renderers.
     *
     * @param Exceptions $exceptions Laravel exception configuration instance.
     */
    public static function register(Exceptions $exceptions): void
    {
        $exceptions->render(function (TokenExpiredException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Token expired.',
                    [],
                    'TOKEN_EXPIRED',
                    401,
                );
            }
        });

        $exceptions->render(function (TokenInvalidException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Token invalid.',
                    [],
                    'TOKEN_INVALID',
                    401,
                );
            }
        });

        $exceptions->render(function (TokenBlacklistedException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Token has been revoked.',
                    [],
                    'TOKEN_REVOKED',
                    401,
                );
            }
        });

        $exceptions->render(function (JWTException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Unauthenticated.',
                    [],
                    'UNAUTHENTICATED',
                    401,
                );
            }
        });

        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Unauthenticated.',
                    [],
                    'UNAUTHENTICATED',
                    401,
                );
            }
        });

        $exceptions->render(function (AuthException $e, $request) {
            if ($request->is('api/*')) {
                $errors = $e->httpStatus === 422
                    ? ['current_password' => [$e->getMessage()]]
                    : [];

                return self::errorJson(
                    $e->getMessage(),
                    $errors,
                    $e->errorCode,
                    $e->httpStatus,
                );
            }
        });

        $exceptions->render(function (DomainException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    $e->getMessage(),
                    [],
                    $e->errorCode,
                    $e->httpStatus,
                );
            }
        });

        $exceptions->render(function (AuthorizationException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Forbidden.',
                    [],
                    'FORBIDDEN',
                    403,
                );
            }
        });

        $exceptions->render(function (AccessDeniedHttpException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Forbidden.',
                    [],
                    'FORBIDDEN',
                    403,
                );
            }
        });

        $exceptions->render(function (ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Validation failed.',
                    $e->errors(),
                    'VALIDATION_ERROR',
                    422,
                );
            }
        });

        $exceptions->render(function (ModelNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Resource not found.',
                    [],
                    'NOT_FOUND',
                    404,
                );
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'The requested endpoint does not exist.',
                    [],
                    'NOT_FOUND',
                    404,
                );
            }
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Method not allowed.',
                    [],
                    'METHOD_NOT_ALLOWED',
                    405,
                );
            }
        });

        $exceptions->render(function (ThrottleRequestsException $e, $request) {
            if ($request->is('api/*')) {
                return self::errorJson(
                    'Too many requests.',
                    [],
                    'TOO_MANY_REQUESTS',
                    429,
                );
            }
        });

        $exceptions->render(function (QueryException $e, $request) {
            if ($request->is('api/*')) {
                Log::error('Database error.', [
                    'message' => $e->getMessage(),
                    'sql' => $e->getSql(),
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                ]);

                return self::errorJson(
                    'A database error occurred.',
                    [],
                    'DATABASE_ERROR',
                    500,
                );
            }
        });

        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*')) {
                Log::error('Unhandled exception.', [
                    'class' => $e::class,
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                ]);

                return self::errorJson(
                    'Server error.',
                    [],
                    'SERVER_ERROR',
                    500,
                );
            }
        });
    }

    /**
     * Build a standardized JSON error response.
     *
     * @param array<string, mixed> $errors Validation or additional error data.
     *
     * @return JsonResponse JSON response instance.
     */
    private static function errorJson(
        string $message,
        array $errors,
        string $code,
        int $status,
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'code' => $code,
        ], $status);
    }
}