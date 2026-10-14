<?php

declare(strict_types=1);

namespace App\Http\Requests\Master;

use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Class UpdateDepartmentRequest
 *
 * Handles validation for updating department records.
 *
 * Responsibilities:
 * - Validates department update payloads.
 * - Ensures department names remain unique.
 * - Confirms that the target department exists before processing updates.
 *
 * Authorization:
 * - Access control is handled through route middleware.
 * - This request validates data and resource availability only.
 *
 * Business Rules:
 * - Department-related workflows should be handled within the service layer.
 */
class UpdateDepartmentRequest extends FormRequest
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
     * Prepare request data before validation.
     *
     * Ensures the department being updated exists before executing
     * validation rules.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
     *
     * @return void
     */
    protected function prepareForValidation(): void
    {
        $departmentId = $this->getDepartmentId();

        if (! Department::query()->whereKey($departmentId)->exists()) {
            abort(
                response()->json([
                    'success' => false,
                    'message' => 'Department not found.',
                    'errors' => [],
                    'code' => 'DEPARTMENT_NOT_FOUND',
                ], 404)
            );
        }
    }

    /**
     * Get validation rules for department update.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments', 'name')
                    ->ignore($this->getDepartmentId()),
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    /**
     * Retrieve the department identifier from route parameters.
     *
     * Supports both explicit ID routes and resource route model binding.
     *
     * @return int
     */
    private function getDepartmentId(): int
    {
        return (int) (
            $this->route('id')
            ?? $this->route('department')
        );
    }
}