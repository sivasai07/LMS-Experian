<?php

declare(strict_types=1);

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class ProcessLeaveRequest
 *
 * Handles validation for leave processing actions.
 *
 * Responsibilities:
 * - Validates optional remarks provided during leave processing.
 * - Ensures processing notes follow the defined input constraints.
 *
 * Business Rules:
 * - Approval/rejection authorization should be handled through policies
 *   or middleware.
 * - Leave status transitions and workflow rules should be handled
 *   inside the service layer.
 */
class ProcessLeaveRequest extends FormRequest
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
     * Get validation rules for leave processing.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'remarks' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }
}