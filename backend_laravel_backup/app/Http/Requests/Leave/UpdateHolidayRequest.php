<?php

declare(strict_types=1);

namespace App\Http\Requests\Leave;

use App\Models\Holiday;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Class UpdateHolidayRequest
 *
 * Handles validation for updating existing holiday records.
 *
 * Responsibilities:
 * - Validates holiday update input.
 * - Prevents duplicate holiday entries with the same name and date.
 * - Excludes the current holiday record during duplicate checks.
 *
 * Business Rules:
 * - Authorization for modifying holidays should be handled through
 *   middleware or authorization policies.
 * - Complex calendar validation rules should remain within the service layer.
 */
class UpdateHolidayRequest extends FormRequest
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
     * Get validation rules for holiday updates.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'holiday_name' => [
                'required',
                'string',
                'max:100',
            ],

            'holiday_date' => [
                'required',
                'date',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    /**
     * Configure additional validation rules.
     *
     * Ensures that another holiday record does not already exist
     * with the same name and date while excluding the current record.
     *
     * @param Validator $validator Laravel validator instance.
     *
     * @return void
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(
            function (Validator $validator): void {
                $holidayId = (int) $this->route('id');
                $holidayName = $this->input('holiday_name');
                $holidayDate = $this->input('holiday_date');

                if (! $holidayName || ! $holidayDate) {
                    return;
                }

                $holidayExists = Holiday::query()
                    ->where('holiday_name', $holidayName)
                    ->whereDate('holiday_date', $holidayDate)
                    ->where('id', '!=', $holidayId)
                    ->exists();

                if ($holidayExists) {
                    $validator->errors()->add(
                        'holiday_name',
                        'A holiday with this name already exists on the given date.'
                    );
                }
            }
        );
    }
}