<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradeTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_any_authenticated_user_can_list_grades(): void
    {
        $emp = $this->employee(); // creates 1 grade via factory
        Grade::factory()->count(3)->create();
        $total = Grade::count();

        $this->actingAs($emp, 'api')
            ->getJson('/api/v1/grades')
            ->assertOk()
            ->assertJsonCount($total, 'data');
    }

    public function test_hr_can_create_grade(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/grades', ['code' => 'ZZ01', 'description' => 'Level 1'])
            ->assertCreated()
            ->assertJsonPath('data.code', 'ZZ01');

        $this->assertDatabaseHas('grades', ['code' => 'ZZ01']);
    }

    public function test_employee_cannot_create_grade(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->postJson('/api/v1/grades', ['code' => 'G1'])
            ->assertForbidden();
    }

    public function test_store_validates_unique_code(): void
    {
        // Create a grade with a known code directly (avoid factory exhaustion)
        Grade::create(['code' => 'XX99', 'description' => 'Test']);

        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/grades', ['code' => 'XX99'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    public function test_hr_can_update_grade(): void
    {
        $grade = Grade::factory()->create(['code' => 'G1']);

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/grades/{$grade->id}", ['code' => 'G2'])
            ->assertOk()
            ->assertJsonPath('data.code', 'G2');
    }

    public function test_manager_cannot_update_grade(): void
    {
        $grade = Grade::factory()->create();

        $this->actingAs($this->manager(), 'api')
            ->putJson("/api/v1/grades/{$grade->id}", ['code' => 'X1'])
            ->assertForbidden();
    }

    public function test_hr_can_delete_unreferenced_grade(): void
    {
        $grade = Grade::factory()->create();

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/grades/{$grade->id}")
            ->assertOk();

        $this->assertDatabaseMissing('grades', ['id' => $grade->id]);
    }

    public function test_cannot_delete_grade_with_grade_job_titles(): void
    {
        $user = User::factory()->employee()->create();
        $grade = Grade::find($user->gradeJobTitle->grade_id);

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/grades/{$grade->id}")
            ->assertStatus(409);
    }

    public function test_returns_404_for_nonexistent_grade(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/grades/99999')
            ->assertNotFound();
    }
}
