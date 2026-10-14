<?php

declare(strict_types=1);

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class LeaveRequestResource
 *
 * Handles transformation of detailed leave request data.
 *
 * Responsibilities:
 * - Formats complete leave request information for API responses.
 * - Includes related employee, leave type, processor, and canceller data when loaded.
 * - Prevents unnecessary database queries by conditionally exposing relationships.
 *
 * Design:
 * - Leave approval, cancellation, and processing logic remain within the service layer.
 * - This resource is responsible only for API response formatting.
 */
class LeaveRequestResource extends JsonResource
{
    /**
     * Transform the leave request resource into an array.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'leave_type_id' => $this->leave_type_id,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'working_days' => (float) $this->working_days,
            'is_half_day' => $this->is_half_day,
            'half_day_type' => $this->half_day_type?->value,
            'start_half_day' => $this->start_half_day?->value,
            'end_half_day' => $this->end_half_day?->value,
            'reason' => $this->reason,
            'status' => $this->status?->value,
            'processed_at' => $this->processed_at?->toDateTimeString(),
            'remarks' => $this->remarks,
            'cancelled_at' => $this->cancelled_at?->toDateTimeString(),
            'cancellation_reason' => $this->cancellation_reason,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),

            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'employee_number' => $this->employee->employee_number,
                'first_name' => $this->employee->first_name,
                'last_name' => $this->employee->last_name,
                'email' => $this->employee->email,
                'manager_id' => $this->employee->manager_id,
                'department' => $this->employee->relationLoaded('department') && $this->employee->department
                    ? [
                        'id' => $this->employee->department->id,
                        'name' => $this->employee->department->name,
                    ]
                    : null,
            ]),

            'leave_type' => $this->whenLoaded('leaveType', fn () => [
                'id' => $this->leaveType->id,
                'name' => $this->leaveType->name,
            ]),

            'processor' => $this->whenLoaded('processor', fn () => $this->processor
                ? [
                    'id' => $this->processor->id,
                    'first_name' => $this->processor->first_name,
                    'last_name' => $this->processor->last_name,
                ]
                : null),

            'canceller' => $this->whenLoaded('canceller', fn () => $this->canceller
                ? [
                    'id' => $this->canceller->id,
                    'first_name' => $this->canceller->first_name,
                    'last_name' => $this->canceller->last_name,
                ]
                : null),
        ];
    }
}