<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Enums\EmploymentType;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Class UpdateUserRequest
 *
 * Handles validation for full user updates performed by HR users.
 *
 * Responsibilities:
 * - Validates employee and organizational information updates.
 * - Validates personal profile information updates.
 * - Ensures unique fields remain unique while excluding the current user.
 * - Supports partial updates through optional validation rules.
 *
 * Authorization:
 * - Access control is handled through route middleware and policies.
 * - This request validates incoming HR update payloads only.
 *
 * Business Rules:
 * - Employee lifecycle workflows should be handled within the service layer.
 * - Organizational hierarchy rules should be enforced through domain logic.
 */
class UpdateUserRequest extends FormRequest
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
     * Get validation rules for user updates.
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
                'sometimes',
                'string',
                'max:20',
                Rule::unique('users', 'employee_number')
                    ->ignore($this->getUserId()),
            ],

            'first_name' => [
                'sometimes',
                'string',
                'max:50',
            ],

            'last_name' => [
                'sometimes',
                'string',
                'max:50',
            ],

            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($this->getUserId()),
            ],

            'joining_date' => [
                'sometimes',
                'date',
            ],

            'relieving_date' => [
                'nullable',
                'date',
                'after_or_equal:joining_date',
            ],

            'role_id' => [
                'sometimes',
                'integer',
                'exists:roles,id',
            ],

            'department_id' => [
                'sometimes',
                'integer',
                'exists:departments,id',
            ],

            'grade_job_title_id' => [
                'sometimes',
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

    /**
     * Retrieve the user identifier from route parameters.
     *
     * Supports both explicit ID routes and resource route binding.
     *
     * @return int
     */
    private function getUserId(): int
    {
        return (int) (
            $this->route('id')
            ?? $this->route('user')
        );
    }
}