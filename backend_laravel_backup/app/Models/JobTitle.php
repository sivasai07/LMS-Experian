<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class JobTitle
 *
 * Represents a job title master record within the organization.
 *
 * Responsibilities:
 * - Stores job title master information.
 * - Defines valid grade and job title combinations.
 * - Provides relationships required for employee assignment and master-data management.
 *
 * Design:
 * - Job title business rules remain within the service/domain layer.
 * - This model handles database representation and relationship definitions.
 */
class JobTitle extends Model
{
    use HasFactory;

    /**
     * Attributes that can be mass assigned.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
    ];

    /**
     * Get valid grade and job title combinations using this title.
     *
     * This relationship is used for master-data operations such as
     * identifying available grades for a specific job title.
     *
     * @return HasMany<GradeJobTitle>
     */
    public function gradeJobTitles(): HasMany
    {
        return $this->hasMany(GradeJobTitle::class);
    }

    /**
     * Get grades associated with this job title.
     *
     * Uses the grade_job_titles mapping table to define the relationship.
     *
     * @return BelongsToMany<Grade>
     */
    public function grades(): BelongsToMany
    {
        return $this->belongsToMany(
            Grade::class,
            'grade_job_titles'
        );
    }
}