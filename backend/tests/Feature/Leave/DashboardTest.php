<?php

declare(strict_types=1);

namespace Tests\Feature\Leave;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function hr(): User
    {
        return User::factory()->hr()->create();
    }

    private function manager(): User
    {
        return User::factory()->manager()->create();
    }

    private function employee(): User
    {
        return User::factory()->employee()->create();
    }

    // -----------------------------------------------------------------------
    // Employee dashboard
    // -----------------------------------------------------------------------

    public function test_employee_can_access_employee_dashboard(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/dashboard/employee')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'total_leaves',
                    'used_leaves',
                    'available_leaves',
                    'pending_requests',
                    'approved_requests',
                    'rejected_requests',
                    'leave_balances',
                    'recent_leaves',
                    'upcoming_holidays',
                ],
            ]);
    }


    public function test_hr_can_access_employee_dashboard(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/dashboard/employee')
            ->assertOk();
    }

    public function test_unauthenticated_cannot_access_employee_dashboard(): void
    {
        $this->getJson('/api/v1/dashboard/employee')->assertUnauthorized();
    }

    // -----------------------------------------------------------------------
    // Manager dashboard
    // -----------------------------------------------------------------------

    public function test_manager_can_access_manager_dashboard(): void
    {
        $this->actingAs($this->manager(), 'api')
            ->getJson('/api/v1/dashboard/manager')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'team_size',
                    'pending_approvals',
                    'team_on_leave_today',
                    'pending_requests',
                ],
            ]);
    }

    public function test_hr_can_access_manager_dashboard(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/dashboard/manager')
            ->assertOk();
    }

    public function test_employee_cannot_access_manager_dashboard(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/dashboard/manager')
            ->assertForbidden();
    }

    // -----------------------------------------------------------------------
    // HR dashboard
    // -----------------------------------------------------------------------

    public function test_hr_can_access_hr_dashboard(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/dashboard/hr')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'total_employees',
                    'pending_requests',
                    'approved_this_year',
                    'on_leave_today',
                    'recent_requests',
                    'upcoming_holidays',
                ],
            ]);
    }

    public function test_manager_cannot_access_hr_dashboard(): void
    {
        $this->actingAs($this->manager(), 'api')
            ->getJson('/api/v1/dashboard/hr')
            ->assertForbidden();
    }

    public function test_employee_cannot_access_hr_dashboard(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/dashboard/hr')
            ->assertForbidden();
    }
}
