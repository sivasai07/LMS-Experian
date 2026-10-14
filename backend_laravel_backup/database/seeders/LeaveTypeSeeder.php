<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

/**
 * Seeder for Leave Categories.
 *
 * Leave types act purely as reporting and analytics categories.
 * All approved leaves deduct from the user's single common leave balance.
 */
class LeaveTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $leaveTypes = [
            [
                'name'             => 'Sick Leave',
                'annual_quota'     => 20,
                'negative_limit'   => 5,
                'half_day_allowed' => true,
                'description'      => 'Category for illness or medical absence.',
            ],
            [
                'name'             => 'Casual Leave',
                'annual_quota'     => 20,
                'negative_limit'   => 5,
                'half_day_allowed' => true,
                'description'      => 'Category for short-notice personal affairs.',
            ],
            [
                'name'             => 'Vacation Leave',
                'annual_quota'     => 20,
                'negative_limit'   => 5,
                'half_day_allowed' => true,
                'description'      => 'Category for planned vacation and holidays.',
            ],
            [
                'name'             => 'Other Leave',
                'annual_quota'     => 20,
                'negative_limit'   => 5,
                'half_day_allowed' => true,
                'description'      => 'Category for miscellanous leave requests.',
            ],
        ];

        foreach ($leaveTypes as $leaveType) {
            LeaveType::query()->updateOrCreate(['name' => $leaveType['name']], $leaveType);
        }
    }
}
