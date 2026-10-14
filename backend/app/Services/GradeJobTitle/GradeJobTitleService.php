<?php

declare(strict_types=1);

namespace App\Services\GradeJobTitle;

use App\Models\GradeJobTitle;
use Illuminate\Database\Eloquent\Collection;

/**
 * Service for grade and job title combinations.
 */
class GradeJobTitleService
{
    /**
     * Get all grade-job-title combinations eager loading grade and jobTitle relations.
     *
     * @return Collection<int, GradeJobTitle>
     */
    public function getAll(): Collection
    {
        return GradeJobTitle::with(['grade', 'jobTitle'])->get();
    }
}
