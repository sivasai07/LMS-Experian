<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the holidays table.
 *
 * This table stores company holidays used in leave calculations.
 *
 * Holidays are considered non-working days and can be excluded when
 * calculating the total leave duration.
 *
 * Example:
 * - Republic Day
 * - Independence Day
 * - Christmas Day
 */
return new class () extends Migration {
    /**
     * Run the database migrations.
     *
     * Creates the holidays table with:
     * - Holiday identification
     * - Holiday date information
     * - Optional description
     * - Duplicate prevention for the same holiday
     */
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {

            // Primary key for uniquely identifying each holiday.
            $table->id();

            // Name of the holiday.
            // Example: Independence Day, Christmas.
            $table->string('holiday_name', 100);

            // Date on which the holiday occurs.
            $table->date('holiday_date');

            // Optional additional information about the holiday.
            $table->string('description', 255)->nullable();

            // Tracks record creation and update time.
            $table->timestamps();

            // Prevents duplicate holiday entries on the same date.
            $table->unique(['holiday_name', 'holiday_date']);

            // Improves performance when searching holidays by date.
            $table->index('holiday_date');
        });
    }

    /**
     * Reverse the database migration.
     *
     * Removes the holidays table during migration rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
