<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class LoginRequest
 *
 * Handles validation for user authentication requests.
 *
 * Responsibilities:
 * - Validates login credentials input.
 * - Ensures required authentication fields are provided.
 *
 * Security:
 * - Credential verification should be handled inside the authentication
 *   service layer.
 * - This request class only validates input format and presence.
 */
class LoginRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     *
     * Authentication authorization is handled through the login flow,
     * therefore this request allows processing.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules for login credentials.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],
        ];
    }
}