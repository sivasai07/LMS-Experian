<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Department;
use App\Models\GradeJobTitle;
use App\Models\JobTitle;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * employee_number sequence. Starts at 1111 per the spec and
     * increments per user created in this run, regardless of table
     * order — this mirrors what a real EmployeeNumberGenerator
     * service will do in Step 10 (Employee Creation).
     */
    private int $nextEmployeeNumber = 1111;

    /**
     * Seeds the org chart in dependency order: HR first (no manager),
     * then managers (reporting to a director or to HR), then
     * individual-contributor employees (reporting to a seeded
     * manager). Each row is processed sequentially so a manager's
     * database ID exists before any of their reports reference it.
     */
    public function run(): void
    {
        $roles = Role::query()->pluck('id', 'name');
        $departments = Department::query()->pluck('id', 'name');

        $people = [
            // -- HR (root account, no manager) --------------------------------
            [
                'email' => 'hr@leavemanagement.test',
                'first_name' => 'Priya',
                'last_name' => 'Sharma',
                'gender' => 'female',
                'role' => 'HR',
                'department' => 'Human Resources',
                'job_title' => 'HR Manager',
                'manager_email' => null,
                'force_password_change' => false, // this is the account HR actually logs in with first
            ],

            // -- Managers -------------------------------------------------------
            [
                'email' => 'director@leavemanagement.test',
                'first_name' => 'Arjun',
                'last_name' => 'Mehta',
                'gender' => 'male',
                'role' => 'Manager',
                'department' => 'Engineering',
                'job_title' => 'Director',
                'manager_email' => null,
            ],
            [
                'email' => 'eng.manager@leavemanagement.test',
                'first_name' => 'Kavya',
                'last_name' => 'Reddy',
                'gender' => 'female',
                'role' => 'Manager',
                'department' => 'Engineering',
                'job_title' => 'Engineering Manager',
                'manager_email' => 'director@leavemanagement.test',
            ],
            [
                'email' => 'product.manager@leavemanagement.test',
                'first_name' => 'Rohan',
                'last_name' => 'Iyer',
                'gender' => 'male',
                'role' => 'Manager',
                'department' => 'Product Management',
                'job_title' => 'Product Manager',
                'manager_email' => 'director@leavemanagement.test',
            ],

            // -- Employees reporting to Engineering Manager ----------------------
            [
                'email' => 'swe1@leavemanagement.test',
                'first_name' => 'Aditya',
                'last_name' => 'Nair',
                'gender' => 'male',
                'role' => 'Employee',
                'department' => 'Engineering',
                'job_title' => 'Software Engineer',
                'manager_email' => 'eng.manager@leavemanagement.test',
            ],
            [
                'email' => 'swe2@leavemanagement.test',
                'first_name' => 'Ishita',
                'last_name' => 'Gupta',
                'gender' => 'female',
                'role' => 'Employee',
                'department' => 'Engineering',
                'job_title' => 'Software Engineer',
                'manager_email' => 'eng.manager@leavemanagement.test',
            ],
            [
                'email' => 'senior.swe@leavemanagement.test',
                'first_name' => 'Vikram',
                'last_name' => 'Rao',
                'gender' => 'male',
                'role' => 'Employee',
                'department' => 'Engineering',
                'job_title' => 'Senior Software Engineer',
                'manager_email' => 'eng.manager@leavemanagement.test',
            ],
            [
                'email' => 'tech.lead@leavemanagement.test',
                'first_name' => 'Neha',
                'last_name' => 'Verma',
                'gender' => 'female',
                'role' => 'Employee',
                'department' => 'Engineering',
                'job_title' => 'Technical Lead',
                'manager_email' => 'eng.manager@leavemanagement.test',
            ],
            [
                'email' => 'devops@leavemanagement.test',
                'first_name' => 'Karan',
                'last_name' => 'Malhotra',
                'gender' => 'male',
                'role' => 'Employee',
                'department' => 'DevOps & Infrastructure',
                'job_title' => 'DevOps Engineer',
                'manager_email' => 'eng.manager@leavemanagement.test',
            ],
            [
                'email' => 'qa@leavemanagement.test',
                'first_name' => 'Ananya',
                'last_name' => 'Joshi',
                'gender' => 'female',
                'role' => 'Employee',
                'department' => 'Quality Assurance',
                'job_title' => 'QA Engineer',
                'manager_email' => 'eng.manager@leavemanagement.test',
            ],

            // -- Employees reporting to Product Manager --------------------------
            [
                'email' => 'data.analyst@leavemanagement.test',
                'first_name' => 'Siddharth',
                'last_name' => 'Kapoor',
                'gender' => 'male',
                'role' => 'Employee',
                'department' => 'Data & Analytics',
                'job_title' => 'Data Analyst',
                'manager_email' => 'product.manager@leavemanagement.test',
            ],
            [
                'email' => 'data.scientist@leavemanagement.test',
                'first_name' => 'Meera',
                'last_name' => 'Pillai',
                'gender' => 'female',
                'role' => 'Employee',
                'department' => 'Data & Analytics',
                'job_title' => 'Data Scientist',
                'manager_email' => 'product.manager@leavemanagement.test',
            ],
            [
                'email' => 'designer@leavemanagement.test',
                'first_name' => 'Ravi',
                'last_name' => 'Choudhary',
                'gender' => 'male',
                'role' => 'Employee',
                'department' => 'Design',
                'job_title' => 'UI/UX Designer',
                'manager_email' => 'product.manager@leavemanagement.test',
            ],

            // -- Employee reporting to HR -----------------------------------------
            [
                'email' => 'hr.exec@leavemanagement.test',
                'first_name' => 'Divya',
                'last_name' => 'Menon',
                'gender' => 'female',
                'role' => 'Employee',
                'department' => 'Human Resources',
                'job_title' => 'HR Executive',
                'manager_email' => 'hr@leavemanagement.test',
            ],
        ];

        foreach ($people as $person) {
            $this->createPerson($person, $roles, $departments);
        }
    }

    /**
     * @param  array<string, mixed>  $person
     * @param  \Illuminate\Support\Collection<string, int>  $roles
     * @param  \Illuminate\Support\Collection<string, int>  $departments
     */
    private function createPerson(array $person, $roles, $departments): void
    {
        // Idempotent: re-running db:seed won't duplicate or renumber people.
        if (User::query()->where('email', $person['email'])->exists()) {
            return;
        }

        $jobTitle = JobTitle::query()->where('title', $person['job_title'])->firstOrFail();
        $gradeJobTitle = GradeJobTitle::query()->where('job_title_id', $jobTitle->id)->firstOrFail();

        $managerId = null;
        if ($person['manager_email'] !== null) {
            $managerId = User::query()->where('email', $person['manager_email'])->value('id');
        }

        User::query()->create([
            'employee_number' => (string) $this->nextEmployeeNumber++,
            'first_name' => $person['first_name'],
            'last_name' => $person['last_name'],
            'email' => $person['email'],
            'password' => Hash::make('Password@123'),
            'gender' => $person['gender'],
            'joining_date' => now()->subMonths(random_int(1, 24)),
            'status' => 'active',
            'employment_type' => 'full_time',
            'force_password_change' => $person['force_password_change'] ?? true,
            'role_id' => $roles[$person['role']],
            'department_id' => $departments[$person['department']],
            'grade_job_title_id' => $gradeJobTitle->id,
            'manager_id' => $managerId,
        ]);
    }
}
