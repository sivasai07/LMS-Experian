<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the grade_job_titles table.
 *
 * Defines the relationship between employee grades
 * and job titles.
 *
 * A job title can be assigned to multiple grades,
 * and a grade can contain multiple job titles.
 */
return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grade_job_titles', function (Blueprint $table): void {
            $table->id();

            // Reference to the employee grade.
            $table->foreignId('grade_id')
                ->constrained('grades')
                ->restrictOnDelete();

            // Reference to the job title.
            $table->foreignId('job_title_id')
                ->constrained('job_titles')
                ->restrictOnDelete();

            $table->timestamps();

            // Prevent duplicate grade and job title assignments.
            $table->unique([
                'grade_id',
                'job_title_id',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_job_titles');
    }
};
