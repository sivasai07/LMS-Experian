<?php

declare(strict_types=1);

namespace Tests\Feature\Leave;

use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveTypeTest extends TestCase
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
    // Index
    // -----------------------------------------------------------------------

    public function test_authenticated_user_can_list_leave_types(): void
    {
        LeaveType::factory()->count(3)->create();

        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/leave-types')
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    public function test_unauthenticated_cannot_list_leave_types(): void
    {
        $this->getJson('/api/v1/leave-types')->assertUnauthorized();
    }

    // -----------------------------------------------------------------------
    // Show
    // -----------------------------------------------------------------------

    public function test_can_view_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $this->actingAs($this->employee(), 'api')
            ->getJson("/api/v1/leave-types/{$leaveType->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $leaveType->id);
    }

    public function test_show_returns_404_for_missing_leave_type(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/leave-types/99999')
            ->assertNotFound();
    }

    // -----------------------------------------------------------------------
    // Store
    // -----------------------------------------------------------------------

    public function test_hr_can_create_leave_type(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/leave-types', [
                'name'             => 'Annual Leave',
                'annual_quota'     => 20,
                'negative_limit'   => 5,
                'half_day_allowed' => true,
                'description'      => 'Standard annual leave',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Annual Leave');

        $this->assertDatabaseHas('leave_types', ['name' => 'Annual Leave']);
    }

    public function test_employee_cannot_create_leave_type(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->postJson('/api/v1/leave-types', [
                'name'         => 'Sick Leave',
                'annual_quota' => 10,
            ])
            ->assertForbidden();
    }

    public function test_store_validates_unique_name(): void
    {
        LeaveType::factory()->create(['name' => 'Annual Leave']);

        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/leave-types', [
                'name'         => 'Annual Leave',
                'annual_quota' => 20,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_requires_name_and_annual_quota(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/leave-types', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'annual_quota']);
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    public function test_hr_can_update_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create(['name' => 'Old Name']);

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/leave-types/{$leaveType->id}", [
                'name'         => 'New Name',
                'annual_quota' => 15,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');
    }

    public function test_manager_cannot_update_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $this->actingAs($this->manager(), 'api')
            ->putJson("/api/v1/leave-types/{$leaveType->id}", ['name' => 'Hacked'])
            ->assertForbidden();
    }

    // -----------------------------------------------------------------------
    // Destroy
    // -----------------------------------------------------------------------

    public function test_hr_can_delete_unreferenced_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/leave-types/{$leaveType->id}")
            ->assertOk();

        $this->assertDatabaseMissing('leave_types', ['id' => $leaveType->id]);
    }

    public function test_employee_cannot_delete_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $this->actingAs($this->employee(), 'api')
            ->deleteJson("/api/v1/leave-types/{$leaveType->id}")
            ->assertForbidden();
    }
}
