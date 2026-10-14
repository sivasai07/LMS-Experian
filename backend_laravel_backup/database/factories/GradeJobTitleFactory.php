<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Grade;
use App\Models\GradeJobTitle;
use App\Models\JobTitle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GradeJobTitle>
 */
class GradeJobTitleFactory extends Factory
{
    protected $model = GradeJobTitle::class;

    public function definition(): array
    {
        return [
            'grade_id' => Grade::factory(),
            'job_title_id' => JobTitle::factory(),
        ];
    }
}
