<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create leave_balances table.
 *
 * Maintains the single common annual leave balance for each employee per calendar year.
 * Every approved leave request deducts from this common balance, regardless of category.
 */
return new class () extends Migration {
    /**
     * Run the database migrations.
     *
     * Creates the leave_balances table storing user_id, year, allocated days,
     * used days, and remaining balance.
     */
    public function up(): void
    {
        Schema::create('leave_balances', function (Blueprint $table) {
            // Primary identifier
            $table->id();

            // Employee owning the leave balance record
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Calendar year for which the balance is maintained
            $table->integer('year');

            // Total leave entitlement assigned for the year (default 20 days)
            $table->decimal('allocated', 5, 2)
                ->default(20.00);

            // Leave already consumed through approved requests
            $table->decimal('used', 5, 2)
                ->default(0.00);

            // Remaining leave available to the employee
            $table->decimal('balance', 5, 2)
                ->default(20.00);

            // Record creation and update timestamps
            $table->timestamps();

            // Ensures only one balance record exists per employee per calendar year
            $table->unique([
                'user_id',
                'year',
            ]);

            // Optimizes employee leave balance retrieval
            $table->index(['user_id', 'year']);
        });
    }

    /**
     * Reverse the database migrations.
     *
     * Drops the leave_balances table.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
