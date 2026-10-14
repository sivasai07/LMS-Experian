<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the roles table used for role-based access control (RBAC).
 *
 * This table stores the different roles available within the application,
 * such as Admin, Manager, Employee, etc. Roles are referenced by users
 * to determine permissions and access levels.
 */
return new class () extends Migration {
    /**
     * Run the database migrations.
     *
     * Creates the roles table with:
     * - A unique role identifier
     * - A unique role name to prevent duplicate role definitions
     * - An optional description for maintaining role metadata
     * - Timestamp fields for auditing creation and updates
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {

            // Primary key for uniquely identifying each role.
            $table->id();

            // Unique role name used for role identification and assignment.
            // Example:HR, Manager, Employee.
            $table->string('name', 50)->unique();

            // Optional description providing additional context about the role.
            $table->string('description', 255)->nullable();

            // Tracks when the role record was created and last modified.
            $table->timestamps();
        });
    }

    /**
     * Reverse the database migration.
     *
     * Removes the roles table when rolling back the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
