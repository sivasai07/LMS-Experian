<?php

declare(strict_types=1);

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class StoreGradeRequest
 *
 * Handles validation for grade creation requests.
 *
 * Responsibilities:
 * - Validates grade creation payload.
 * - Ensures grade codes remain unique.
 * - Validates optional grade description data.
 *
 * Authorization:
 * - Access control is handled through route middleware.
 * - This request is responsible only for validating incoming data.
 *
 * Business Rules:
 * - Grade assignment logic and related workflows should be handled
 *   within the service layer.
 */
class StoreGradeRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     *
     * Authorization is managed through middleware and policies.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules for grade creation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:10',
                'unique:grades,code',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}