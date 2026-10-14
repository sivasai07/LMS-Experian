<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentTest extends TestCase
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

    public function test_hr_can_list_departments(): void
    {
        $hr = $this->hr(); // creates 1 dept via factory
        Department::factory()->count(3)->create();
        $total = Department::count();

        $this->actingAs($hr, 'api')
            ->getJson('/api/v1/departments')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount($total, 'data');
    }

    public function test_employee_can_list_departments(): void
    {
        Department::factory()->count(2)->create();

        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/departments')
            ->assertOk();
    }

    public function test_unauthenticated_cannot_list_departments(): void
    {
        $this->getJson('/api/v1/departments')->assertUnauthorized();
    }

    // -----------------------------------------------------------------------
    // Show
    // -----------------------------------------------------------------------

    public function test_hr_can_view_department(): void
    {
        $dept = Department::factory()->create();

        $this->actingAs($this->hr(), 'api')
            ->getJson("/api/v1/departments/{$dept->id}")
            ->assertOk()
            ->assertJsonPath('data.name', $dept->name);
    }

    // -----------------------------------------------------------------------
    // Store
    // -----------------------------------------------------------------------

    public function test_hr_can_create_department(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/departments', [
                'name'        => 'Engineering',
                'description' => 'Software team',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Engineering');

        $this->assertDatabaseHas('departments', ['name' => 'Engineering']);
    }

    public function test_manager_cannot_create_department(): void
    {
        $this->actingAs($this->manager(), 'api')
            ->postJson('/api/v1/departments', ['name' => 'Sales'])
            ->assertForbidden();
    }

    public function test_employee_cannot_create_department(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->postJson('/api/v1/departments', ['name' => 'Sales'])
            ->assertForbidden();
    }

    public function test_store_validates_unique_name(): void
    {
        Department::factory()->create(['name' => 'HR Department']);

        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/departments', ['name' => 'HR Department'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_requires_name(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/departments', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    public function test_hr_can_update_department(): void
    {
        $dept = Department::factory()->create(['name' => 'Old Name']);

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/departments/{$dept->id}", ['name' => 'New Name'])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');
    }

    public function test_manager_cannot_update_department(): void
    {
        $dept = Department::factory()->create();

        $this->actingAs($this->manager(), 'api')
            ->putJson("/api/v1/departments/{$dept->id}", ['name' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_update_allows_same_name_for_same_record(): void
    {
        $dept = Department::factory()->create(['name' => 'Engineering']);

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/departments/{$dept->id}", [
                'name'        => 'Engineering',
                'description' => 'Updated description',
            ])
            ->assertOk();
    }

    // -----------------------------------------------------------------------
    // Destroy
    // -----------------------------------------------------------------------

    public function test_hr_can_delete_unreferenced_department(): void
    {
        $dept = Department::factory()->create();

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/departments/{$dept->id}")
            ->assertOk();

        $this->assertDatabaseMissing('departments', ['id' => $dept->id]);
    }

    public function test_cannot_delete_department_with_users(): void
    {
        $dept = Department::factory()->create();
        User::factory()->employee()->create(['department_id' => $dept->id]);

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/departments/{$dept->id}")
            ->assertStatus(409);
    }

    public function test_employee_cannot_delete_department(): void
    {
        $dept = Department::factory()->create();

        $this->actingAs($this->employee(), 'api')
            ->deleteJson("/api/v1/departments/{$dept->id}")
            ->assertForbidden();
    }
}
