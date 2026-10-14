<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Grade;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    /**
     * Seeds the application's grade structure.
     *
     * Grades follow three organizational tracks:
     * - G0-G9 : General / Individual Contributor
     * - M1-M7 : Management
     * - P1-P7 : Professional / Specialist
     */
    public function run(): void
    {
        $gradeCodes = [];

        // General grades
        for ($level = 0; $level <= 9; $level++) {
            $gradeCodes[] = "G{$level}";
        }

        // Management grades
        for ($level = 1; $level <= 7; $level++) {
            $gradeCodes[] = "M{$level}";
        }

        // Professional grades
        for ($level = 1; $level <= 7; $level++) {
            $gradeCodes[] = "P{$level}";
        }

        foreach ($gradeCodes as $code) {
            Grade::query()->firstOrCreate([
                'code' => $code,
            ]);
        }
    }
}
