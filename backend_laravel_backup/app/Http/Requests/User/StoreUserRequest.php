<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Enums\EmploymentType;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Class StoreUserRequest
 *
 * Handles validation for user creation requests.
 *
 * Responsibilities:
 * - Validates HR-provided employee information.
 * - Ensures company-related fields are present during onboarding.
 * - Validates optional personal profile information.
 * - Applies password security requirements.
 *
 * Authorization:
 * - Access control is handled through route middleware.
 * - This request validates incoming data only.
 *
 * Business Rules:
 * - Employee onboarding workflows should be handled within the service layer.
 * - Organizational hierarchy rules should be validated through domain logic.
 */
class StoreUserRequest extends FormRequest
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
     * Get validation rules for user creation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /*
             |--------------------------------------------------------------------------
             | Employment Information
             |--------------------------------------------------------------------------
             */

            'employee_number' => [
                'required',
                'string',
                'max:20',
                'unique:users,employee_number',
            ],

            'first_name' => [
                'required',
                'string',
                'max:50',
            ],

            'last_name' => [
                'required',
                'string',
                'max:50',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                Password::min(8)
                    ->mixedCase()
                    ->numbers(),
            ],

            'joining_date' => [
                'required',
                'date',
            ],

            'role_id' => [
                'required',
                'integer',
                'exists:roles,id',
            ],

            'department_id' => [
                'required',
                'integer',
                'exists:departments,id',
            ],

            'grade_job_title_id' => [
                'required',
                'integer',
                'exists:grade_job_titles,id',
            ],

            'manager_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'status' => [
                'sometimes',
                Rule::enum(UserStatus::class),
            ],

            'employment_type' => [
                'sometimes',
                Rule::enum(EmploymentType::class),
            ],

            /*
             |--------------------------------------------------------------------------
             | Personal Information
             |--------------------------------------------------------------------------
             */

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

            /*
             |--------------------------------------------------------------------------
             | Account Settings
             |--------------------------------------------------------------------------
             */

            'force_password_change' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}