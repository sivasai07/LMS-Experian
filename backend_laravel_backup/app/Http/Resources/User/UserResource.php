<?php

declare(strict_types=1);

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class UserResource
 *
 * Handles transformation of complete user details for API responses.
 *
 * Responsibilities:
 * - Provides detailed user information for profile, show, create, and update responses.
 * - Conditionally includes relationships only when eager-loaded.
 * - Prevents unnecessary database queries by avoiding lazy-loaded relationships.
 *
 * Design:
 * - User business rules and data manipulation remain within the service/domain layer.
 * - This resource is responsible only for API response formatting.
 */
class UserResource extends JsonResource
{
    /**
     * Transform the user resource into an array.
     *
     * Includes:
     * - Personal information.
     * - Employment details.
     * - Organization hierarchy.
     * - Leave balance information when loaded.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_number' => $this->employee_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'personal_email' => $this->personal_email,
            'phone' => $this->phone,
            'gender' => $this->gender?->value ?? (is_string($this->gender) ? $this->gender : null),
            'dob' => $this->dob?->toDateString(),
            'blood_group' => $this->blood_group?->value,
            'address' => $this->address,
            'emergency_contact' => $this->emergency_contact,
            'profile_photo' => $this->profile_photo,
            'joining_date' => $this->joining_date?->toDateString(),
            'relieving_date' => $this->relieving_date?->toDateString(),
            'role_id' => $this->role_id,
            'department_id' => $this->department_id,
            'grade_job_title_id' => $this->grade_job_title_id,
            'manager_id' => $this->manager_id,
            'status' => $this->status?->value,
            'employment_type' => $this->employment_type?->value,
            'force_password_change' => $this->force_password_change,

            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role->id,
                'name' => $this->role->name,
            ]),

            'department' => $this->whenLoaded('department', fn () => [
                'id' => $this->department->id,
                'name' => $this->department->name,
            ]),

            'grade' => $this->whenLoaded('gradeJobTitle', fn () => $this->gradeJobTitle->grade ? [
                'id' => $this->gradeJobTitle->grade->id,
                'code' => $this->gradeJobTitle->grade->code,
            ] : null),

            'job_title' => $this->whenLoaded('gradeJobTitle', fn () => $this->gradeJobTitle->jobTitle ? [
                'id' => $this->gradeJobTitle->jobTitle->id,
                'title' => $this->gradeJobTitle->jobTitle->title,
            ] : null),

            'manager' => $this->whenLoaded('manager', fn () => $this->manager ? [
                'id' => $this->manager->id,
                'first_name' => $this->manager->first_name,
                'last_name' => $this->manager->last_name,
                'email' => $this->manager->email,
            ] : null),

            'leave_balances' => $this->whenLoaded(
                'leaveBalances',
                fn () => $this->leaveBalances->map(fn ($lb) => [
                    'leave_type_id' => $lb->leave_type_id,
                    'year' => $lb->year,
                    'allocated' => $lb->allocated,
                    'used' => $lb->used,
                    'balance' => $lb->balance,
                ])
            ),

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}