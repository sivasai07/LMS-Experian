<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seeds the three permission-level roles the system authorizes against.
     * Kept intentionally small — role_id drives middleware checks, so
     * every role added here needs matching authorization logic later.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'HR', 'description' => 'Full access to all employees, leave records, and master data.'],
            ['name' => 'Manager', 'description' => 'Can view and approve/reject leave requests for direct reports.'],
            ['name' => 'Employee', 'description' => 'Can apply for leave and view their own leave history and balance.'],
        ];

        foreach ($roles as $role) {
            Role::query()->firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
