<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Exception thrown for domain-level business rule violations.
 *
 * Services use this exception when an operation cannot be completed
 * due to application-specific rules. The global exception handler can
 * convert this exception into a consistent API response format.
 */
class DomainException extends RuntimeException
{
    /**
     * Create a new domain exception instance.
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
     * Create an exception when a requested resource does not exist.
     *
     * @param string $resource Resource name used in the error message.
     *
     * @return self Domain exception instance.
     */
    public static function notFound(string $resource = 'Resource'): self
    {
        return new self(
            message: "{$resource} not found.",
            errorCode: 'NOT_FOUND',
            httpStatus: 404,
        );
    }

    /**
     * Create an exception for forbidden operations.
     *
     * @param string $message Custom error message.
     *
     * @return self Domain exception instance.
     */
    public static function forbidden(string $message = 'Forbidden.'): self
    {
        return new self(
            message: $message,
            errorCode: 'FORBIDDEN',
            httpStatus: 403,
        );
    }

    /**
     * Create an exception for conflicting operations.
     *
     * @param string $message Conflict description.
     *
     * @return self Domain exception instance.
     */
    public static function conflict(string $message): self
    {
        return new self(
            message: $message,
            errorCode: 'CONFLICT',
            httpStatus: 409,
        );
    }

    /**
     * Create an exception for validation or processing failures.
     *
     * @param string $message Failure description.
     *
     * @return self Domain exception instance.
     */
    public static function unprocessable(string $message): self
    {
        return new self(
            message: $message,
            errorCode: 'UNPROCESSABLE',
            httpStatus: 422,
        );
    }

    /**
     * Create an exception when a resource cannot be deleted.
     *
     * @param string $resource Resource name used in the error message.
     *
     * @return self Domain exception instance.
     */
    public static function cannotDelete(string $resource = 'Resource'): self
    {
        return new self(
            message: "{$resource} cannot be deleted because it is referenced by other records.",
            errorCode: 'CONFLICT',
            httpStatus: 409,
        );
    }
}