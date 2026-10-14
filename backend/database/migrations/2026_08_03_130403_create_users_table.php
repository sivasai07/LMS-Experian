<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create users table.
 *
 * Stores employee master data, organizational hierarchy,
 * authentication details, and employment information.
 *
 * Leave balances are intentionally NOT stored here — see the
 * leave_balances table, which tracks a separate balance per
 * (user, leave_type) pair.
 */
return new class () extends Migration {
    /**
     * Run the database migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // Primary identifier
            $table->id();

            // Unique employee identification number
            $table->string('employee_number', 20)
                ->unique();

            // Employee personal information
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('email')
                ->unique();

            $table->string('personal_email')
                ->nullable();

            $table->string('phone', 20)
                ->nullable();

            // Authentication credential
            $table->string('password');

            // Employee demographic information
            $table->string('gender', 20)
                ->nullable();

            $table->date('dob')
                ->nullable();

            $table->string('blood_group', 5)
                ->nullable();

            $table->string('address', 255)
                ->nullable();

            $table->string('emergency_contact', 20)
                ->nullable();

            // Profile image storage path
            $table->string('profile_photo')
                ->nullable();

            // Employment details
            $table->date('joining_date');

            $table->date('relieving_date')
                ->nullable();

            $table->string('status', 20)
                ->default('active');

            $table->string('employment_type', 20)
                ->default('full_time');

            // Forces users to update temporary/default passwords
            $table->boolean('force_password_change')
                ->default(true);

            // Organizational references
            $table->foreignId('role_id')
                ->constrained('roles')
                ->restrictOnDelete();

            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete();


            // Employee grade and job title combination.
            // Example:
            // G2 + Software Engineer
            // G3 + Software Engineer
            $table->foreignId('grade_job_title_id')
                ->constrained('grade_job_titles')
                ->restrictOnDelete();

            // Reporting hierarchy:
            // References the employee's direct manager.
            // Nullable for employees without assigned managers
            // and top-level organizational roles.
            $table->foreignId('manager_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Laravel authentication support
            $table->rememberToken();

            // Audit timestamps
            $table->timestamps();

            // Maintains historical employee records
            $table->softDeletes();

            // Query optimization indexes
            $table->index('manager_id');
            $table->index('department_id');
            $table->index('status');
            $table->index('grade_job_title_id');
            $table->index('role_id');
        });
    }

    /**
     * Reverse the database migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
