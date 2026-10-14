<?php

declare(strict_types=1);

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

/**
 * Class ApiFormRequest
 *
 * Base form request for API validation.
 *
 * Responsibilities:
 * - Provides common request validation behavior for API requests.
 * - Rejects unexpected input fields that are not explicitly defined
 *   within request validation rules.
 *
 * Security:
 * - Prevents accidental mass assignment of unsupported fields.
 * - Ensures API contracts remain strict and predictable.
 *
 * Usage:
 * Extend this class for API FormRequests that require strict payload validation.
 */
abstract class ApiFormRequest extends FormRequest
{
    /**
     * Prepare request data before validation.
     *
     * Validates that incoming payload fields are explicitly supported
     * by the child request validation rules.
     *
     * @throws ValidationException When unexpected fields are provided.
     *
     * @return void
     */
    protected function prepareForValidation(): void
    {
        $allowedFields = array_keys($this->rules());

        $providedFields = array_keys($this->all());

        $unexpectedFields = array_diff(
            $providedFields,
            $allowedFields
        );

        if ($unexpectedFields === []) {
            return;
        }

        throw ValidationException::withMessages([
            'fields' => [
                'Unexpected fields: ' . implode(', ', $unexpectedFields),
            ],
        ]);
    }
}