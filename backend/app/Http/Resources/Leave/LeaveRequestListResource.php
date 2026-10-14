<?php

declare(strict_types=1);

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class LeaveRequestListResource
 *
 * Handles transformation of leave request list data.
 * Includes processed_by_name and processed_at timestamps for Action Taken tracking.
 */
class LeaveRequestListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $statusVal = $this->status?->value ?? (string) $this->status;
        $isPending = strtolower($statusVal) === 'pending';

        $processorName = null;
        if ($this->canceller) {
            $processorName = trim(($this->canceller->first_name ?? '') . ' ' . ($this->canceller->last_name ?? ''));
        } elseif ($this->processor) {
            $processorName = trim(($this->processor->first_name ?? '') . ' ' . ($this->processor->last_name ?? ''));
        }

        $processedAt = $this->processed_at?->toDateTimeString()
            ?? $this->cancelled_at?->toDateTimeString()
            ?? (!$isPending ? $this->updated_at?->toDateTimeString() : null);

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
            'cancellation_reason' => $this->cancellation_reason,
            'remarks' => $this->remarks,
            'status' => $statusVal,
            'processed_by_name' => $processorName,
            'processed_at' => $processedAt,
            'created_at' => $this->created_at?->toDateTimeString(),
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
        ];
    }
}