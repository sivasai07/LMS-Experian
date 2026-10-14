<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters — each seeder here depends on the ones before it
     * (roles/departments/grades/job_titles before grade_job_titles,
     * everything before users, users before leave_balances). Running
     * `php artisan db:seed` initializes the full application in one
     * command.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DepartmentSeeder::class,
            GradeSeeder::class,
            JobTitleSeeder::class,
            GradeJobTitleSeeder::class,
            LeaveTypeSeeder::class,
            HolidaySeeder::class,
            UserSeeder::class,
            LeaveBalanceSeeder::class,
        ]);
    }
}
