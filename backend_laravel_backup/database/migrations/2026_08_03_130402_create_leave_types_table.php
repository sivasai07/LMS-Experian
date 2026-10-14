<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the leave_types table.
 *
 * This table stores different leave categories and their basic policies.
 *
 * Example:
 * - Annual Leave
 * - Sick Leave
 * - Casual Leave
 */
return new class () extends Migration {
    /**
     * Run the database migrations.
     *
     * Creates the leave_types table with:
     * - Leave type information
     * - Annual entitlement
     * - Negative balance allowance
     * - Half-day leave configuration
     */
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table) {

            // Primary key for uniquely identifying each leave type.
            $table->id();

            // Unique leave type name.
            // Example: Annual Leave, Sick Leave.
            $table->string('name', 50)->unique();

            // Total leave entitlement allowed per year.
            // Example: Annual Leave = 24 days.
            $table->decimal('annual_quota', 5, 2)->default(0);

            // Maximum negative balance allowed.
            // Example: 5 means employee can use up to 5 days in advance.
            $table->decimal('negative_limit', 5, 2)->default(5);

            // Defines whether half-day leave applications are allowed.
            $table->boolean('half_day_allowed')->default(true);

            // Optional additional information about the leave type.
            $table->string('description', 255)->nullable();

            // Maintains record creation and update timestamps.
            $table->timestamps();
        });
    }

    /**
     * Reverse the database migration.
     *
     * Removes the leave_types table during rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
