<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the departments table.
 *
 * This table stores organizational departments used to group employees
 * and manage department-level data within the application.
 *
 * Example departments:
 * - Human Resources
 * - Finance
 * - Engineering
 * - Operations
 */
return new class () extends Migration {
    /**
     * Run the database migrations.
     *
     * Creates the departments table with:
     * - A unique identifier for each department
     * - A unique department name to prevent duplicate records
     * - An optional description for additional department details
     * - Timestamp fields for record tracking and auditing
     */
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {

            // Primary key used to uniquely identify each department.
            $table->id();

            // Unique department name used for employee grouping and references.
            // Example: PHP, Data Science.
            $table->string('name', 100)->unique();

            // Optional field to store additional information about the department.
            $table->string('description', 255)->nullable();

            // Automatically maintains created_at and updated_at timestamps.
            $table->timestamps();
        });
    }

    /**
     * Reverse the database migration.
     *
     * Drops the departments table during migration rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
