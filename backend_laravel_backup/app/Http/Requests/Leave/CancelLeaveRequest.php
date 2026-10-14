<?php

declare(strict_types=1);

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class CancelLeaveRequest
 *
 * Handles validation for employee leave cancellation requests.
 *
 * Responsibilities:
 * - Validates cancellation request input.
 * - Ensures a valid cancellation reason is provided.
 *
 * Business Rules:
 * - Leave cancellation eligibility should be handled in the service layer.
 * - Restrictions such as cancelling approved, processed, or expired leaves
 *   should not be enforced within request validation.
 */
class CancelLeaveRequest extends FormRequest
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
     * Get validation rules for leave cancellation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cancellation_reason' => [
                'required',
                'string',
                'max:500',
            ],
        ];
    }
}