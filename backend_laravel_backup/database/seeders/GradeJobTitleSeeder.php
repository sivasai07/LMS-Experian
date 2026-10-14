<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\GradeJobTitle;
use App\Models\JobTitle;
use Illuminate\Database\Seeder;

class GradeJobTitleSeeder extends Seeder
{
    /**
     * Seeds the primary grade-to-job-title mappings used by the
     * application. Additional mappings can be added later if the
     * organization allows the same job title at multiple grades
     * (for example, Software Engineer at both G2 and G3).
     */
    public function run(): void
    {
        $map = [
            'Trainee Software Engineer' => 'G0',
            'Associate Software Engineer' => 'G1',
            'Software Engineer' => 'G2',
            'Senior Software Engineer' => 'G4',
            'Technical Lead' => 'G6',
            'Engineering Manager' => 'M2',
            'Software Architect' => 'P5',
            'DevOps Engineer' => 'G3',
            'QA Engineer' => 'G2',
            'Data Analyst' => 'G2',
            'Data Scientist' => 'P3',
            'Product Manager' => 'M1',
            'UI/UX Designer' => 'G2',
            'HR Executive' => 'G1',
            'HR Manager' => 'M2',
            'Director' => 'M6',
        ];

        foreach ($map as $titleName => $gradeCode) {
            $jobTitle = JobTitle::query()->where('title', $titleName)->firstOrFail();
            $grade = Grade::query()->where('code', $gradeCode)->firstOrFail();

            GradeJobTitle::query()->firstOrCreate([
                'grade_id' => $grade->id,
                'job_title_id' => $jobTitle->id,
            ]);
        }
    }
}
