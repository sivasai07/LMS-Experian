<?php

declare(strict_types=1);

namespace Tests\Feature\Leave;

use App\Models\Holiday;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HolidayTest extends TestCase
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

    public function test_authenticated_user_can_list_holidays(): void
    {
        Holiday::factory()->count(3)->create();

        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/holidays')
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    public function test_unauthenticated_cannot_list_holidays(): void
    {
        $this->getJson('/api/v1/holidays')->assertUnauthorized();
    }

    // -----------------------------------------------------------------------
    // Show
    // -----------------------------------------------------------------------

    public function test_can_view_holiday(): void
    {
        $holiday = Holiday::factory()->create();

        $this->actingAs($this->employee(), 'api')
            ->getJson("/api/v1/holidays/{$holiday->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $holiday->id);
    }

    public function test_show_returns_404_for_missing_holiday(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->getJson('/api/v1/holidays/99999')
            ->assertNotFound();
    }

    // -----------------------------------------------------------------------
    // Store
    // -----------------------------------------------------------------------

    public function test_hr_can_create_holiday(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/holidays', [
                'holiday_name' => 'Independence Day',
                'holiday_date' => '2025-08-15',
                'description'  => 'National Holiday',
            ])
            ->assertCreated()
            ->assertJsonPath('data.holiday_name', 'Independence Day');

        $this->assertDatabaseHas('holidays', ['holiday_name' => 'Independence Day']);
    }

    public function test_employee_cannot_create_holiday(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->postJson('/api/v1/holidays', [
                'holiday_name' => 'Test Holiday',
                'holiday_date' => '2025-01-01',
            ])
            ->assertForbidden();
    }

    public function test_manager_cannot_create_holiday(): void
    {
        $this->actingAs($this->manager(), 'api')
            ->postJson('/api/v1/holidays', [
                'holiday_name' => 'Test Holiday',
                'holiday_date' => '2025-01-01',
            ])
            ->assertForbidden();
    }

    public function test_store_requires_holiday_name_and_date(): void
    {
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/holidays', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['holiday_name', 'holiday_date']);
    }

    public function test_store_validates_duplicate_name_on_same_date(): void
    {
        Holiday::factory()->create([
            'holiday_name' => 'Christmas',
            'holiday_date' => '2025-12-25',
        ]);

        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/holidays', [
                'holiday_name' => 'Christmas',
                'holiday_date' => '2025-12-25',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['holiday_name']);
    }

    public function test_same_name_on_different_date_is_allowed(): void
    {
        Holiday::factory()->create([
            'holiday_name' => 'Christmas',
            'holiday_date' => '2025-12-25',
        ]);

        // Same name, different year — should be allowed
        $this->actingAs($this->hr(), 'api')
            ->postJson('/api/v1/holidays', [
                'holiday_name' => 'Christmas',
                'holiday_date' => '2026-12-25',
            ])
            ->assertCreated();
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    public function test_hr_can_update_holiday(): void
    {
        $holiday = Holiday::factory()->create(['holiday_name' => 'Old Holiday']);

        $this->actingAs($this->hr(), 'api')
            ->putJson("/api/v1/holidays/{$holiday->id}", [
                'holiday_name' => 'New Holiday',
                'holiday_date' => $holiday->holiday_date->format('Y-m-d'),
            ])
            ->assertOk()
            ->assertJsonPath('data.holiday_name', 'New Holiday');
    }

    public function test_employee_cannot_update_holiday(): void
    {
        $holiday = Holiday::factory()->create();

        $this->actingAs($this->employee(), 'api')
            ->putJson("/api/v1/holidays/{$holiday->id}", [
                'holiday_name' => 'Hacked',
                'holiday_date' => $holiday->holiday_date->format('Y-m-d'),
            ])
            ->assertForbidden();
    }

    // -----------------------------------------------------------------------
    // Destroy
    // -----------------------------------------------------------------------

    public function test_hr_can_delete_holiday(): void
    {
        $holiday = Holiday::factory()->create();

        $this->actingAs($this->hr(), 'api')
            ->deleteJson("/api/v1/holidays/{$holiday->id}")
            ->assertOk();

        $this->assertDatabaseMissing('holidays', ['id' => $holiday->id]);
    }

    public function test_employee_cannot_delete_holiday(): void
    {
        $holiday = Holiday::factory()->create();

        $this->actingAs($this->employee(), 'api')
            ->deleteJson("/api/v1/holidays/{$holiday->id}")
            ->assertForbidden();
    }
}
