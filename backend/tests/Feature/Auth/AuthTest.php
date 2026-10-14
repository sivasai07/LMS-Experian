<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // POST /api/v1/auth/login
    // -------------------------------------------------------------------------

    public function test_login_with_valid_active_user_credentials_returns_token(): void
    {
        $user = User::factory()->employee()->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'Password@123',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.token_type', 'bearer')
            ->assertJsonPath('data.user.email', $user->email);

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertIsString($response->json('data.token'));
    }

    public function test_login_with_wrong_password_returns_401(): void
    {
        $user = User::factory()->employee()->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'WrongPassword@999',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('code', 'INVALID_CREDENTIALS');
    }

    public function test_login_with_unknown_email_returns_401(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'nonexistent@example.com',
            'password' => 'Password@123',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('code', 'INVALID_CREDENTIALS');
    }

    public function test_login_with_inactive_user_returns_403(): void
    {
        $user = User::factory()->employee()->create([
            'status' => UserStatus::Inactive,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'Password@123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'ACCOUNT_INACTIVE');
    }

    public function test_login_with_terminated_user_returns_403(): void
    {
        $user = User::factory()->employee()->terminated()->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'Password@123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'ACCOUNT_INACTIVE');
    }

    public function test_login_with_force_password_change_returns_token_with_flag(): void
    {
        $user = User::factory()->employee()->forcedPasswordChange()->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'Password@123',
        ]);

        // Login succeeds — client uses the force_password_change flag to redirect
        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.force_password_change', true);

        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_login_with_missing_email_returns_422(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'password' => 'Password@123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_with_missing_password_returns_422(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    // -------------------------------------------------------------------------
    // POST /api/v1/auth/logout
    // -------------------------------------------------------------------------

    public function test_logout_with_valid_token_returns_200(): void
    {
        $user = User::factory()->employee()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Successfully logged out.');
    }

    public function test_logout_without_token_returns_401(): void
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // POST /api/v1/auth/refresh
    // -------------------------------------------------------------------------

    public function test_refresh_with_valid_token_returns_new_token(): void
    {
        $user = User::factory()->employee()->create();

        // Use a real Bearer token — jwt->refresh() reads from the Authorization header.
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'Password@123',
        ]);
        $token = $loginResponse->json('data.token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/refresh');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertIsString($response->json('data.token'));
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_refresh_without_token_returns_401(): void
    {
        $response = $this->postJson('/api/v1/auth/refresh');

        $response->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // GET /api/v1/auth/me
    // -------------------------------------------------------------------------

    public function test_me_with_valid_token_returns_user_data(): void
    {
        $user = User::factory()->employee()->create();
        $user->load('role');

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.first_name', $user->first_name);

        $this->assertNotNull($response->json('data.role'));
        $this->assertArrayHasKey('id', $response->json('data.role'));
        $this->assertArrayHasKey('name', $response->json('data.role'));

        $response->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');
    }

    public function test_me_without_token_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // POST /api/v1/auth/change-password
    // -------------------------------------------------------------------------

    public function test_change_password_success_returns_new_token_and_clears_force_flag(): void
    {
        $user = User::factory()->employee()->forcedPasswordChange()->create();

        // Issue a real Bearer token directly — force_password_change blocks the
        // login endpoint, so we bypass it in the test setup.
        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/change-password', [
                'current_password'      => 'Password@123',
                'password'              => 'NewPassword@456',
                'password_confirmation' => 'NewPassword@456',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertIsString($response->json('data.token'));
        $this->assertNotEmpty($response->json('data.token'));

        $this->assertDatabaseHas('users', [
            'id'                    => $user->id,
            'force_password_change' => false,
        ]);
    }

    public function test_change_password_with_wrong_current_password_returns_422(): void
    {
        $user = User::factory()->employee()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/v1/auth/change-password', [
                'current_password'      => 'WrongPassword@999',
                'password'              => 'NewPassword@456',
                'password_confirmation' => 'NewPassword@456',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'INVALID_CURRENT_PASSWORD');

        $this->assertArrayHasKey('current_password', $response->json('errors'));
    }

    public function test_change_password_with_weak_password_returns_422(): void
    {
        $user = User::factory()->employee()->create();

        // 'abc123' — no uppercase, fails regex
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/v1/auth/change-password', [
                'current_password'      => 'Password@123',
                'password'              => 'abc123',
                'password_confirmation' => 'abc123',
            ]);

        $response->assertStatus(422);
    }

    public function test_change_password_without_token_returns_401(): void
    {
        $response = $this->postJson('/api/v1/auth/change-password', [
            'current_password'      => 'Password@123',
            'password'              => 'NewPassword@456',
            'password_confirmation' => 'NewPassword@456',
        ]);

        $response->assertStatus(401);
    }

    public function test_change_password_mismatched_confirmation_returns_422(): void
    {
        $user = User::factory()->employee()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/v1/auth/change-password', [
                'current_password'      => 'Password@123',
                'password'              => 'Valid@123',
                'password_confirmation' => 'Different@456',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
