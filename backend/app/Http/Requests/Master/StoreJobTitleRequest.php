<?php

declare(strict_types=1);

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class StoreJobTitleRequest
 *
 * Handles validation for job title creation requests.
 *
 * Responsibilities:
 * - Validates job title creation payload.
 * - Ensures job title names remain unique.
 * - Validates optional job title description data.
 *
 * Authorization:
 * - Access control is handled through route middleware.
 * - This request is responsible only for validating incoming request data.
 *
 * Business Rules:
 * - Job title assignment, grade mapping, and employee relationships
 *   should be managed within the service layer.
 */
class StoreJobTitleRequest extends FormRequest
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
     * Get validation rules for job title creation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'max:100',
                'unique:job_titles,title',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}