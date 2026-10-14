<?php

declare(strict_types=1);

namespace App\Services\Grade;

use App\Exceptions\DomainException;
use App\Models\Grade;
use Illuminate\Database\Eloquent\Collection;

/**
 * Handles grade-related business operations.
 *
 * Responsible for grade entity resolution and enforcing domain rules.
 * Controllers should only provide identifiers and validated data.
 */
class GradeService
{
    /**
     * Retrieve all grades ordered by code.
     *
     * @return Collection<int, Grade>
     */
    public function all(): Collection
    {
        return Grade::orderBy('code')->get();
    }

    /**
     * Find a grade by its primary key.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findById(int $id): Grade
    {
        return Grade::findOrFail($id);
    }

    /**
     * Create a new grade.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Grade
    {
        return Grade::create($data);
    }

    /**
     * Update an existing grade.
     *
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): Grade
    {
        $grade = $this->findById($id);

        $grade->update($data);

        return $grade->refresh();
    }

    /**
     * Delete a grade.
     *
     * Grades referenced by grade-job-title mappings cannot be deleted.
     *
     * @throws DomainException
     */
    public function delete(int $id): void
    {
        $grade = $this->findById($id);

        if ($grade->gradeJobTitles()->exists()) {
            throw DomainException::cannotDelete('Grade');
        }

        $grade->delete();
    }
}