<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class ChangePasswordRequest
 *
 * Handles validation rules for authenticated user password changes.
 *
 * Responsibilities:
 * - Validates the current password input.
 * - Ensures the new password meets security requirements.
 * - Provides custom validation messages.
 *
 * Security:
 * - Current password verification should be handled inside the service layer.
 * - Password complexity rules are enforced before processing the update.
 */
class ChangePasswordRequest extends FormRequest
{
    /**
     * Password complexity validation pattern.
     *
     * Requirements:
     * - At least one lowercase letter.
     * - At least one uppercase letter.
     * - At least one numeric digit.
     */
    private const PASSWORD_PATTERN = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/';

    /**
     * Determine whether the user is authorized to make this request.
     *
     * Authorization should be handled through authentication middleware
     * and route protection.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules for password change request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:' . self::PASSWORD_PATTERN,
            ],

            'password_confirmation' => [
                'required',
                'string',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.regex' => 'The password must contain at least one uppercase letter, one lowercase letter, and one digit.',
        ];
    }
}