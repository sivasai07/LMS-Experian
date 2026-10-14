<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class UpdateProfileRequest
 *
 * Handles validation for employee and manager personal profile updates.
 *
 * Responsibilities:
 * - Validates user-editable personal profile information.
 * - Restricts updates to personal fields only.
 * - Prevents modification of company-managed fields such as role,
 *   department, grade, employment type, and reporting structure.
 *
 * Authorization:
 * - Access control is handled through authentication middleware
 *   and authorization policies.
 * - This request validates incoming profile data only.
 *
 * Business Rules:
 * - Company profile changes should be managed through HR workflows.
 * - Profile update processing should be handled within the service layer.
 */
class UpdateProfileRequest extends FormRequest
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
     * Get validation rules for profile updates.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /*
             |--------------------------------------------------------------------------
             | Personal Information
             |--------------------------------------------------------------------------
             */

            'first_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'last_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'personal_email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'string',
                'regex:/^[0-9+\-\s()]{7,20}$/',
            ],

            'gender' => [
                'nullable',
                'string',
            ],

            'dob' => [
                'nullable',
                'date',
                'before:today',
            ],

            'blood_group' => [
                'nullable',
                'string',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'emergency_contact' => [
                'nullable',
                'string',
                'regex:/^[0-9+\-\s()]{7,20}$/',
            ],

            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:2048',
            ],
        ];
    }
}