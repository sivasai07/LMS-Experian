<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
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

    private function validUserPayload(array $overrides = []): array
    {
        return array_merge([
            'employee_number'    => 'EMP' . fake()->unique()->numerify('####'),
            'first_name'         => 'Jane',
            'last_name'          => 'Doe',
            'email'              => fake()->unique()->safeEmail(),
            'password'           => 'Password@123',
            'joining_date'       => '2024-01-01',
            'role_id'            => User::factory()->employee()->create()->role_id,
            'department_id'      => User::factory()->employee()->create()->department_id,
            'grade_job_title_id' => User::factory()->employee()->create()->grade_job_title_id,
        ], $overrides);
    }

    // -----------------------------------------------------------------------
    // Index — HR only
    // -----------------------------------------------------------------------

    public function test_hr_can_list_all_users(): void
    {
        User::factory()->employee()->count(5)->create();

        $response = $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users')
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertArrayHasKey('meta', $response->json());
        $this->assertArrayHasKey('total', $response->json('meta'));
    }

    public function test_manager_cannot_access_user_list(): void
    {
        $this->actingAs($this->manager(), 'api')
            ->getJson('/api/v1/users')
            ->assertForbidden();
    }

    public function test_employee_cannot_access_user_list(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/users')
            ->assertForbidden();
    }

    public function test_unauthenticated_cannot_list_users(): void
    {
        $this->getJson('/api/v1/users')->assertUnauthorized();
    }

    // -----------------------------------------------------------------------
    // Index — search, filter, pagination
    // -----------------------------------------------------------------------

    public function test_hr_can_search_users_by_name(): void
    {
        User::factory()->employee()->create(['first_name' => 'Alice', 'last_name' => 'Smith']);
        User::factory()->employee()->create(['first_name' => 'Bob',   'last_name' => 'Jones']);

        $response = $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users?search=Alice')
            ->assertOk();

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Alice', $data[0]['first_name']);
    }

    public function test_hr_can_filter_by_status(): void
    {
        User::factory()->employee()->create(['status' => UserStatus::Active]);
        User::factory()->employee()->terminated()->create();

        $response = $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users?status=active')
            ->assertOk();

        collect($response->json('data'))->each(
            fn ($u) => $this->assertEquals('active', $u['status'])
        );
    }

    public function test_hr_can_paginate_users(): void
    {
        User::factory()->employee()->count(20)->create();

        $response = $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users?per_page=5')
            ->assertOk();

        $this->assertCount(5, $response->json('data'));
        $this->assertEquals(5, $response->json('meta.per_page'));
    }

    // -----------------------------------------------------------------------
    // Show
    // -----------------------------------------------------------------------

    public function test_hr_can_view_any_user(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($this->hr(), 'api')
            ->getJson("/api/v1/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_returns_404_for_nonexistent_user(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users/99999')
            ->assertNotFound();
    }

    // -----------------------------------------------------------------------
    // Store — HR only
    // -----------------------------------------------------------------------

    public function test_hr_can_create_user(): void
    {
        $payload = $this->validUserPayload();

        $response = $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/users', $payload)
            ->assertCreated();

        $this->assertDatabaseHas('users', ['email' => $payload['email']]);
        $response->assertJsonPath('data.email', $payload['email']);
    }

    public function test_manager_cannot_create_user(): void
    {
        $this->actingAs($this->manager(), 'api')
            ->postJson('/api/v1/users', $this->validUserPayload())
            ->assertForbidden();
    }

    public function test_employee_cannot_create_user(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->postJson('/api/v1/users', $this->validUserPayload())
            ->assertForbidden();
    }

    public function test_store_validates_unique_email(): void
    {
        $existing = User::factory()->employee()->create();

        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/users', $this->validUserPayload(['email' => $existing->email]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_store_validates_unique_employee_number(): void
    {
        $existing = User::factory()->employee()->create();

        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/users', $this->validUserPayload(['employee_number' => $existing->employee_number]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['employee_number']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/users', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'password']);
    }

    public function test_store_validates_existing_role_id(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/users', $this->validUserPayload(['role_id' => 9999]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role_id']);
    }

    // -----------------------------------------------------------------------
    // Update — HR only
    // -----------------------------------------------------------------------

    public function test_hr_can_update_user(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/users/{$user->id}", ['first_name' => 'Updated'])
            ->assertOk()
            ->assertJsonPath('data.first_name', 'Updated');
    }

    public function test_manager_cannot_update_another_user(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($this->manager(), 'api')
            ->putJson("/api/v1/users/{$user->id}", ['first_name' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_update_allows_same_email_for_same_user(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/users/{$user->id}", [
                'email'      => $user->email,
                'first_name' => 'SamEmail',
            ])
            ->assertOk();
    }

    // -----------------------------------------------------------------------
    // Destroy — HR soft-delete
    // -----------------------------------------------------------------------

    public function test_hr_can_soft_delete_user(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/users/{$user->id}")
            ->assertOk();

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_hr_cannot_delete_own_account(): void
    {
        $hr = $this->hr();

        $this->actingAs($hr, 'api')
            ->deleteJson("/api/v1/users/{$hr->id}")
            ->assertForbidden();
    }

    public function test_manager_cannot_delete_user(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($this->manager(), 'api')
            ->deleteJson("/api/v1/users/{$user->id}")
            ->assertForbidden();
    }

    public function test_soft_deleted_user_not_returned_in_list(): void
    {
        $user = User::factory()->employee()->create();
        $user->delete();

        $response = $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($user->id, $ids);
    }

    // -----------------------------------------------------------------------
    // Profile — self
    // -----------------------------------------------------------------------

    public function test_any_user_can_view_own_profile(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($user, 'api')
            ->getJson('/api/v1/users/profile')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonMissingPath('data.password');
    }

    public function test_profile_does_not_expose_sensitive_fields(): void
    {
        $user = User::factory()->employee()->create();

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/v1/users/profile')
            ->assertOk();

        $this->assertArrayNotHasKey('password', $response->json('data'));
        $this->assertArrayNotHasKey('remember_token', $response->json('data'));
    }

    // -----------------------------------------------------------------------
    // Update Profile — personal fields only
    // -----------------------------------------------------------------------

    public function test_employee_can_update_own_personal_fields(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/users/profile', [
                'phone'          => '1234567890',
                'personal_email' => 'personal@example.com',
            ])
            ->assertOk()
            ->assertJsonPath('data.phone', '1234567890');
    }

    public function test_employee_cannot_update_company_fields_via_profile(): void
    {
        $user    = User::factory()->employee()->create();
        $original = $user->email;

        // Even if someone sends email in the request, it should be ignored
        $this->actingAs($user, 'api')
            ->putJson('/api/v1/users/profile', [
                'email' => 'newemail@hacked.com',
                'phone' => '0987654321',
            ])
            ->assertOk();

        // Company email unchanged
        $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => $original]);
    }

    public function test_manager_can_update_own_profile(): void
    {
        $manager = $this->manager();

        $this->actingAs($manager, 'api')
            ->putJson('/api/v1/users/profile', ['phone' => '5555555555'])
            ->assertOk()
            ->assertJsonPath('data.phone', '5555555555');
    }

    public function test_update_profile_validates_phone_format(): void
    {
        $user = User::factory()->employee()->create();

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/users/profile', ['phone' => 'not-a-phone'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['phone']);
    }

    // -----------------------------------------------------------------------
    // Direct Reports
    // -----------------------------------------------------------------------

    public function test_manager_can_view_direct_reports(): void
    {
        $manager = $this->manager();
        User::factory()->employee()->count(3)->create(['manager_id' => $manager->id]);

        $response = $this->actingAs($manager, 'api')
            ->getJson('/api/v1/users/direct-reports')
            ->assertOk();

        $this->assertEquals(3, $response->json('meta.total'));
    }

    public function test_manager_only_sees_own_direct_reports(): void
    {
        $manager1 = $this->manager();
        $manager2 = $this->manager();

        User::factory()->employee()->count(2)->create(['manager_id' => $manager1->id]);
        User::factory()->employee()->count(3)->create(['manager_id' => $manager2->id]);

        $response = $this->actingAs($manager1, 'api')
            ->getJson('/api/v1/users/direct-reports')
            ->assertOk();

        $this->assertEquals(2, $response->json('meta.total'));
    }

    public function test_employee_cannot_view_direct_reports(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/users/direct-reports')
            ->assertForbidden();
    }

    // -----------------------------------------------------------------------
    // Managers and Employees lists
    // -----------------------------------------------------------------------

    public function test_hr_can_list_managers(): void
    {
        User::factory()->manager()->count(3)->create();

        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users/managers')
            ->assertOk()
            ->assertJsonPath('meta.total', 3);
    }

    public function test_hr_can_list_employees(): void
    {
        User::factory()->employee()->count(4)->create();

        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/users/employees')
            ->assertOk()
            ->assertJsonPath('meta.total', 4);
    }

    public function test_employee_cannot_list_all_employees(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/users/employees')
            ->assertForbidden();
    }
}
