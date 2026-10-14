<?php

declare(strict_types=1);

namespace App\Services\Department;

use App\Exceptions\DomainException;
use App\Models\Department;
use Illuminate\Database\Eloquent\Collection;

/**
 * Handles department-related business operations.
 *
 * Service methods are responsible for entity resolution and business rules.
 * Controllers should only provide request data and identifiers.
 */
class DepartmentService
{
    /**
     * Retrieve all departments ordered alphabetically by name.
     *
     * @return Collection<int, Department>
     */
    public function all(): Collection
    {
        return Department::orderBy('name')->get();
    }

    /**
     * Find a department by ID.
     *
     * @throws DomainException
     */
    public function findById(int $id): Department
    {
        $department = Department::find($id);

        if (! $department) {
            throw DomainException::notFound('Department');
        }

        return $department;
    }

    /**
     * Create a new department.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Department
    {
        return Department::create($data);
    }

    /**
     * Update an existing department.
     *
     * @param array<string, mixed> $data
     *
     * @throws DomainException
     */
    public function update(int $id, array $data): Department
    {
        $department = $this->findById($id);

        $department->update($data);

        return $department->refresh();
    }

    /**
     * Delete a department.
     *
     * Departments with assigned users cannot be deleted.
     *
     * @throws DomainException
     */
    public function delete(int $id): void
    {
        $department = $this->findById($id);

        if ($department->users()->exists()) {
            throw DomainException::cannotDelete('Department');
        }

        $department->delete();
    }
}