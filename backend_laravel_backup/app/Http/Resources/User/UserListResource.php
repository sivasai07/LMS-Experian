<?php

declare(strict_types=1);

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class UserListResource
 *
 * Handles transformation of lightweight user data for paginated responses.
 *
 * Responsibilities:
 * - Provides optimized user information for listing endpoints.
 * - Keeps response payload minimal by excluding heavy relationships and sensitive data.
 * - Conditionally includes relationships only when they are eager-loaded.
 *
 * Design:
 * - User business logic remains within the service/domain layer.
 * - This resource is responsible only for API response formatting.
 */
class UserListResource extends JsonResource
{
    /**
     * Transform the user resource into an array.
     *
     * Excludes:
     * - Password information.
     * - Leave balances.
     * - Deep relationship nesting.
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
            'phone' => $this->phone,
            'gender' => $this->gender?->value ?? (is_string($this->gender) ? $this->gender : null),
            'profile_photo' => $this->profile_photo,
            'status' => $this->status?->value,
            'employment_type' => $this->employment_type?->value,
            'joining_date' => $this->joining_date?->toDateString(),
            'role_id' => $this->role_id,
            'department_id' => $this->department_id,
            'grade_job_title_id' => $this->grade_job_title_id,
            'manager_id' => $this->manager_id,
            
            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role->id,
                'name' => $this->role->name,
            ]),

            'department' => $this->whenLoaded('department', fn () => [
                'id' => $this->department->id,
                'name' => $this->department->name,
            ]),

            'grade' => $this->whenLoaded(
                'gradeJobTitle',
                fn () => $this->gradeJobTitle?->grade ? [
                    'id' => $this->gradeJobTitle->grade->id,
                    'code' => $this->gradeJobTitle->grade->code,
                ] : null
            ),

            'job_title' => $this->whenLoaded(
                'gradeJobTitle',
                fn () => $this->gradeJobTitle?->jobTitle ? [
                    'id' => $this->gradeJobTitle->jobTitle->id,
                    'title' => $this->gradeJobTitle->jobTitle->title,
                ] : null
            ),

            'manager' => $this->whenLoaded('manager', fn () => $this->manager ? [
                'id' => $this->manager->id,
                'first_name' => $this->manager->first_name,
                'last_name' => $this->manager->last_name,
            ] : null),

            'deleted_at' => $this->deleted_at?->toDateTimeString(),
        ];
    }
}