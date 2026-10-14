<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the job_titles table.
 *
 * Stores reusable job designations used across the organization.
 *
 * A single job title (for example, "Software Engineer" or "Manager")
 * can be associated with multiple grades through related tables.
 */
return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_titles', function (Blueprint $table): void {
            $table->id();

            // Official job designation.
            $table->string('title', 100);

            // Optional notes or additional details.
            $table->string('description', 255)->nullable();

            $table->timestamps();

            // Ensure each job title is unique.
            $table->unique('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_titles');
    }
};
