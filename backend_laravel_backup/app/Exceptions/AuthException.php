<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Exception thrown for domain-level authentication failures.
 *
 * This exception carries a machine-readable error code and HTTP status
 * code, allowing the global exception handler to generate consistent
 * API responses without containing authentication business logic.
 */
class AuthException extends RuntimeException
{
    /**
     * Create a new authentication exception instance.
     *
     * @param string $message Human-readable exception message.
     * @param string $errorCode Machine-readable error identifier.
     * @param int $httpStatus HTTP response status code.
     */
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $httpStatus,
    ) {
        parent::__construct($message);
    }

    /**
     * Create an exception for invalid login credentials.
     *
     * @return self Authentication exception instance.
     */
    public static function invalidCredentials(): self
    {
        return new self(
            message: 'Invalid credentials.',
            errorCode: 'INVALID_CREDENTIALS',
            httpStatus: 401,
        );
    }

    /**
     * Create an exception for inactive user accounts.
     *
     * @return self Authentication exception instance.
     */
    public static function accountInactive(): self
    {
        return new self(
            message: 'Account is not active.',
            errorCode: 'ACCOUNT_INACTIVE',
            httpStatus: 403,
        );
    }

    /**
     * Create an exception when a password change is required.
     *
     * @return self Authentication exception instance.
     */
    public static function forcePasswordChange(): self
    {
        return new self(
            message: 'Password change required.',
            errorCode: 'FORCE_PASSWORD_CHANGE',
            httpStatus: 403,
        );
    }

    /**
     * Create an exception for an incorrect current password.
     *
     * @return self Authentication exception instance.
     */
    public static function incorrectCurrentPassword(): self
    {
        return new self(
            message: 'The current password is incorrect.',
            errorCode: 'INVALID_CURRENT_PASSWORD',
            httpStatus: 422,
        );
    }

    /**
     * Create an exception for unauthenticated requests.
     *
     * @return self Authentication exception instance.
     */
    public static function unauthenticated(): self
    {
        return new self(
            message: 'Unauthenticated.',
            errorCode: 'UNAUTHENTICATED',
            httpStatus: 401,
        );
    }
}