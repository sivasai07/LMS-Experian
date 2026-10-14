<?php

declare(strict_types=1);

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Class UpdateJobTitleRequest
 *
 * Handles validation for updating job title records.
 *
 * Responsibilities:
 * - Validates job title update payloads.
 * - Ensures job title names remain unique.
 * - Validates optional job title description data.
 *
 * Authorization:
 * - Access control is handled through route middleware.
 * - This request is responsible only for validating incoming data.
 *
 * Business Rules:
 * - Job title assignments, grade mappings, and employee relationships
 *   should be handled within the service layer.
 */
class UpdateJobTitleRequest extends FormRequest
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
     * Get validation rules for job title updates.
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
                Rule::unique('job_titles', 'title')
                    ->ignore($this->getJobTitleId()),
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    /**
     * Retrieve the job title identifier from route parameters.
     *
     * Supports both explicit ID routes and resource route binding.
     *
     * @return int
     */
    private function getJobTitleId(): int
    {
        return (int) (
            $this->route('id')
            ?? $this->route('job_title')
        );
    }
}