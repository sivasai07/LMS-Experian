<?php

declare(strict_types=1);

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class ApplyLeaveRequest
 *
 * Handles validation for employee leave application requests.
 *
 * Responsibilities:
 * - Validates leave application input data.
 * - Ensures valid leave dates and leave type selection.
 * - Handles half-day leave validation rules.
 */
class ApplyLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'leave_type_id' => [
                'required',
                'integer',
                'exists:leave_types,id',
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],

            'is_half_day' => [
                'sometimes',
                'boolean',
            ],

            'half_day_type' => [
                'nullable',
                'in:first_half,second_half,full_day',
            ],

            'start_half_day' => [
                'nullable',
                'in:first_half,second_half,full_day',
            ],

            'end_half_day' => [
                'nullable',
                'in:first_half,second_half,full_day',
            ],

            'reason' => [
                'required',
                'string',
                'max:500',
            ],
        ];
    }
}