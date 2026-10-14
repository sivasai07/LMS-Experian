<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\JobTitle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobTitleTest extends TestCase
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

    public function test_any_authenticated_user_can_list_job_titles(): void
    {
        $emp = $this->employee(); // creates 1 job title via factory
        JobTitle::factory()->count(4)->create();
        $total = JobTitle::count();

        $this->actingAs($emp, 'api')
            ->getJson('/api/v1/job-titles')
            ->assertOk()
            ->assertJsonCount($total, 'data');
    }

    public function test_hr_can_create_job_title(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/job-titles', ['title' => 'Software Engineer'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Software Engineer');
    }

    public function test_employee_cannot_create_job_title(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->postJson('/api/v1/job-titles', ['title' => 'Software Engineer'])
            ->assertForbidden();
    }

    public function test_store_validates_unique_title(): void
    {
        JobTitle::factory()->create(['title' => 'Software Engineer']);

        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/job-titles', ['title' => 'Software Engineer'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_store_requires_title(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/job-titles', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_hr_can_update_job_title(): void
    {
        $jt = JobTitle::factory()->create(['title' => 'Junior Dev']);

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/job-titles/{$jt->id}", ['title' => 'Senior Dev'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Senior Dev');
    }

    public function test_manager_cannot_update_job_title(): void
    {
        $jt = JobTitle::factory()->create();

        $this->actingAs($this->manager(), 'api')
            ->putJson("/api/v1/job-titles/{$jt->id}", ['title' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_hr_can_delete_unreferenced_job_title(): void
    {
        $jt = JobTitle::factory()->create();

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/job-titles/{$jt->id}")
            ->assertOk();

        $this->assertDatabaseMissing('job_titles', ['id' => $jt->id]);
    }

    public function test_cannot_delete_job_title_with_grade_job_titles(): void
    {
        $user = User::factory()->employee()->create();
        $jt   = JobTitle::find($user->gradeJobTitle->job_title_id);

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/job-titles/{$jt->id}")
            ->assertStatus(409);
    }

    public function test_returns_404_for_nonexistent_job_title(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/job-titles/99999')
            ->assertNotFound();
    }
}
