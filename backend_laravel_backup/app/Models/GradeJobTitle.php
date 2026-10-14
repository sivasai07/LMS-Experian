<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class GradeJobTitle
 *
 * Represents a valid grade and job title combination.
 *
 * Example:
 * - Grade: G2
 * - Job Title: Software Engineer
 *
 * Responsibilities:
 * - Maintains valid grade and job title mappings.
 * - Ensures users are assigned to an existing organizational combination.
 * - Defines relationships used for employee assignment and master-data management.
 *
 * Design:
 * - Users reference this model through grade_job_title_id instead of storing
 *   separate grade_id and job_title_id values.
 * - This prevents invalid grade and job title combinations at the database level.
 * - Business validation remains within the service/domain layer.
 */
class GradeJobTitle extends Model
{
    use HasFactory;

    /**
     * Attributes that can be mass assigned.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'grade_id',
        'job_title_id',
    ];

    /**
     * Get the grade associated with this combination.
     *
     * @return BelongsTo<Grade, GradeJobTitle>
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    /**
     * Get the job title associated with this combination.
     *
     * @return BelongsTo<JobTitle, GradeJobTitle>
     */
    public function jobTitle(): BelongsTo
    {
        return $this->belongsTo(JobTitle::class);
    }

    /**
     * Get users assigned to this exact grade and job title combination.
     *
     * @return HasMany<User, GradeJobTitle>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}