<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\JobTitle;
use Illuminate\Database\Seeder;

class JobTitleSeeder extends Seeder
{
    /**
     * Seeds a representative subset of job titles (not the full list
     * from the org's title catalog) spanning IC, specialist, and
     * management tracks so grade_job_titles has enough variety to
     * exercise every track when we map combinations next.
     */
    public function run(): void
    {
        $titles = [
            'Trainee Software Engineer',
            'Associate Software Engineer',
            'Software Engineer',
            'Senior Software Engineer',
            'Technical Lead',
            'Engineering Manager',
            'Software Architect',
            'DevOps Engineer',
            'QA Engineer',
            'Data Analyst',
            'Data Scientist',
            'Product Manager',
            'UI/UX Designer',
            'HR Executive',
            'HR Manager',
            'Director',
        ];

        foreach ($titles as $title) {
            JobTitle::query()->firstOrCreate(['title' => $title]);
        }
    }
}
