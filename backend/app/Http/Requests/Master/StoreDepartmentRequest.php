<?php

declare(strict_types=1);

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class StoreDepartmentRequest
 *
 * Handles validation for department creation requests.
 *
 * Responsibilities:
 * - Validates department creation payload.
 * - Ensures department names are unique.
 * - Validates optional department metadata.
 *
 * Authorization:
 * - Access control is handled through route middleware.
 * - This request only validates incoming request data.
 *
 * Business Rules:
 * - Department-related workflows should be handled within the service layer.
 */
class StoreDepartmentRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     *
     * Authorization is handled through middleware and policies.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules for department creation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                'unique:departments,name',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}