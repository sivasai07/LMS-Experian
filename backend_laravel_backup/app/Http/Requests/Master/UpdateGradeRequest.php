<?php

declare(strict_types=1);

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Class UpdateGradeRequest
 *
 * Handles validation for updating grade records.
 *
 * Responsibilities:
 * - Validates grade update payloads.
 * - Ensures grade codes remain unique.
 * - Validates optional grade description data.
 *
 * Authorization:
 * - Access control is handled through route middleware.
 * - This request is responsible only for validating incoming data.
 *
 * Business Rules:
 * - Grade relationships and assignment workflows should be handled
 *   within the service layer.
 */
class UpdateGradeRequest extends FormRequest
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
     * Get validation rules for grade updates.
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
                Rule::unique('grades', 'code')
                    ->ignore($this->getGradeId()),
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    /**
     * Retrieve the grade identifier from route parameters.
     *
     * Supports both explicit ID routes and resource route binding.
     *
     * @return int
     */
    private function getGradeId(): int
    {
        return (int) (
            $this->route('id')
            ?? $this->route('grade')
        );
    }
}