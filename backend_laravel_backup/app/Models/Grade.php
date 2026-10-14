<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class Grade
 *
 * Represents an employee grade master record.
 *
 * Responsibilities:
 * - Stores grade master information used for employee classification.
 * - Defines relationships with grade and job title mappings.
 * - Provides mass-assignment protection for grade attributes.
 *
 * Design:
 * - Grade-related business rules remain within the service/domain layer.
 * - This model handles database representation and relationship definitions.
 */
class Grade extends Model
{
    use HasFactory;

    /**
     * Attributes that can be mass assigned.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'description',
    ];

    /**
     * Get valid grade and job title combinations using this grade.
     *
     * This relationship is used for master-data operations such as
     * identifying which job titles are available under a specific grade.
     *
     * Note:
     * - This is not the relationship path for retrieving an employee's job title.
     * - Employee job title access should use User::gradeJobTitle().
     *
     * @return HasMany<GradeJobTitle>
     */
    public function gradeJobTitles(): HasMany
    {
        return $this->hasMany(GradeJobTitle::class);
    }

    /**
     * Get job titles associated with this grade.
     *
     * Uses the grade_job_titles mapping table to define the relationship.
     *
     * @return BelongsToMany<JobTitle>
     */
    public function jobTitles(): BelongsToMany
    {
        return $this->belongsToMany(
            JobTitle::class,
            'grade_job_titles'
        );
    }
}