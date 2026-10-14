<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            'Engineering',
            'Quality Assurance',
            'Product Management',
            'Data & Analytics',
            'DevOps & Infrastructure',
            'Design',
            'Human Resources',
            'Finance',
            'Sales',
            'Operations',
        ];

        foreach ($departments as $name) {
            Department::query()->firstOrCreate(['name' => $name]);
        }
    }
}
