<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the grades table.
 *
 * Stores employee grade levels used for organizational
 * classification and job hierarchy.
 *
 * Examples include G1, G2, G3, M1, M2, and P1.
 */
return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table): void {
            $table->id();

            // Unique grade identifier.
            $table->string('code', 10)->unique();

            // Optional notes or additional details.
            $table->string('description', 255)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
