<?php

declare(strict_types=1);

namespace App\Services\Leave;

use App\Exceptions\DomainException;
use App\Models\LeaveType;
use Illuminate\Database\Eloquent\Collection;

/**
 * Service: LeaveTypeService
 *
 * Handles management of leave categories (e.g. Sick Leave, Casual Leave, Vacation Leave, Other Leave).
 */
class LeaveTypeService
{
    /**
     * Get all leave categories ordered by name.
     *
     * @return Collection<int, LeaveType>
     */
    public function all(): Collection
    {
        return LeaveType::orderBy('name')->get();
    }

    /**
     * Find a leave category by ID.
     *
     * @param  int  $id
     * @return LeaveType
     */
    public function findById(int $id): LeaveType
    {
        return LeaveType::findOrFail($id);
    }

    /**
     * Create a new leave category.
     *
     * @param  array<string, mixed>  $data
     * @return LeaveType
     */
    public function create(array $data): LeaveType
    {
        return LeaveType::create($data);
    }

    /**
     * Update an existing leave category.
     *
     * @param  int                   $id
     * @param  array<string, mixed>  $data
     * @return LeaveType
     */
    public function update(int $id, array $data): LeaveType
    {
        $leaveType = $this->findById($id);
        $leaveType->update($data);

        return $leaveType->refresh();
    }

    /**
     * Delete a leave category if not referenced by any leave request.
     *
     * @param  int  $id
     * @return void
     *
     * @throws DomainException if category is in use.
     */
    public function delete(int $id): void
    {
        $leaveType = $this->findById($id);

        if ($leaveType->leaveRequests()->exists()) {
            throw DomainException::cannotDelete('Leave type');
        }

        $leaveType->delete();
    }
}
