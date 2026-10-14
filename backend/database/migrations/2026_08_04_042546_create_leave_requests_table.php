<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the leave_requests table.
 *
 * Stores employee leave applications and manages the complete
 * leave approval workflow lifecycle including approval, rejection,
 * cancellation, and record activation status.
 */
return new class () extends Migration {
    /**
     * Run the database migrations.
     */
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table): void {
            $table->id();

            /*
             * Employee leave request ownership.
             */
            $table->foreignId('employee_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('leave_type_id')
                ->constrained('leave_types')
                ->restrictOnDelete();

            /*
             * Leave duration details.
             */
            $table->date('start_date');
            $table->date('end_date');

            $table->decimal('working_days', 5, 1);

            $table->boolean('is_half_day')
                ->default(false);

            $table->string('half_day_type', 20)
                ->nullable();

            $table->string('start_half_day', 20)
                ->nullable();

            $table->string('end_half_day', 20)
                ->nullable();

            /*
             * Leave request details.
             */
            $table->string('reason', 500);

            $table->string('status', 20)
                ->default('pending');

            $table->boolean('is_active')
                ->default(true);

            /*
             * Approval workflow tracking.
             */
            $table->foreignId('processed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('processed_at')
                ->nullable();

            $table->string('remarks', 500)
                ->nullable();

            /*
             * Cancellation audit information.
             */
            $table->foreignId('cancelled_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('cancelled_at')
                ->nullable();

            $table->string('cancellation_reason', 500)
                ->nullable();

            $table->timestamps();

            /*
             * Query optimization indexes.
             */
            $table->index([
                'employee_id',
                'status',
            ]);

            $table->index([
                'start_date',
                'end_date',
            ]);

            $table->index([
                'processed_by',
                'status',
            ]);
        });
    }

    /**
     * Reverse the database migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
