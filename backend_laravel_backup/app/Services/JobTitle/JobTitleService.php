<?php

declare(strict_types=1);

namespace App\Services\JobTitle;

use App\Exceptions\DomainException;
use App\Models\JobTitle;
use Illuminate\Database\Eloquent\Collection;

/**
 * Job Title business logic.
 *
 * All methods resolve entities by ID internally — controllers pass IDs only.
 */
class JobTitleService
{
    /**
     * All job titles ordered alphabetically.
     *
     * @return Collection<int, JobTitle>
     */
    public function all(): Collection
    {
        return JobTitle::orderBy('title')->get();
    }

    /**
     * Find a job title by primary key or throw 404.
     */
    public function findById(int $id): JobTitle
    {
        return JobTitle::findOrFail($id);
    }

    /**
     * Create a new job title.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): JobTitle
    {
        return JobTitle::create($data);
    }

    /**
     * Update a job title by ID.
     *
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): JobTitle
    {
        $jobTitle = $this->findById($id);

        $jobTitle->fill($data);

        if ($jobTitle->isDirty()) {
            $jobTitle->save();
        }

        return $jobTitle->refresh();
    }

    /**
     * Delete a job title by ID.
     *
     * @throws DomainException if referenced by grade_job_titles.
     */
    public function delete(int $id): void
    {
        $jobTitle = $this->findById($id);

        if ($jobTitle->gradeJobTitles()->exists()) {
            throw DomainException::cannotDelete('Job title');
        }

        $jobTitle->delete();
    }
}