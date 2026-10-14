<?php

declare(strict_types=1);

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Class UpdateLeaveTypeRequest
 *
 * Handles validation for updating existing leave type records.
 *
 * Responsibilities:
 * - Validates leave type update input.
 * - Ensures leave type names remain unique.
 * - Allows partial updates through optional fields.
 *
 * Business Rules:
 * - Leave policy changes and impact calculations should be handled
 *   within the service layer.
 * - Authorization for managing leave types should be controlled through
 *   middleware or authorization policies.
 */
class UpdateLeaveTypeRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     *
     * Access control should be handled through authentication middleware
     * and authorization policies.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules for leave type updates.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $leaveTypeId = (int) $this->route('leave_type');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('leave_types', 'name')
                    ->ignore($leaveTypeId),
            ],

            'annual_quota' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:365',
            ],

            'negative_limit' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:30',
            ],

            'half_day_allowed' => [
                'sometimes',
                'boolean',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}