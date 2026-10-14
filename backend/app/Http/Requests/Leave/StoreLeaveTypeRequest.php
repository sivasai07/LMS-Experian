<?php

declare(strict_types=1);

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class StoreLeaveTypeRequest
 *
 * Handles validation for creating leave type records.
 *
 * Responsibilities:
 * - Validates leave type configuration input.
 * - Ensures leave quota and restriction values are within allowed limits.
 * - Prevents duplicate leave type names.
 *
 * Business Rules:
 * - Leave entitlement calculations should be handled by the service layer.
 * - Role-based access for managing leave types should be controlled through
 *   middleware or authorization policies.
 */
class StoreLeaveTypeRequest extends FormRequest
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
     * Get validation rules for leave type creation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:50',
                'unique:leave_types,name',
            ],

            'annual_quota' => [
                'required',
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