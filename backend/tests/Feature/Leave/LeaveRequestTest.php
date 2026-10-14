<?php

declare(strict_types=1);

namespace Tests\Feature\Leave;

use App\Enums\LeaveStatus;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestTest extends TestCase
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

    private function nextMonday(): string
    {
        return Carbon::now()->next('Monday')->format('Y-m-d');
    }

    private function nextFriday(): string
    {
        return Carbon::now()->next('Friday')->format('Y-m-d');
    }

    // -----------------------------------------------------------------------
    // Apply
    // -----------------------------------------------------------------------

    public function test_employee_can_apply_for_leave(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create([
            'half_day_allowed' => true,
            'annual_quota'     => 20,
            'negative_limit'   => 5,
        ]);

        $monday = $this->nextMonday();

        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id' => $leaveType->id,
                'start_date'    => $monday,
                'end_date'      => $monday,
                'reason'        => 'Medical appointment',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_apply_requires_reason(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create();

        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id' => $leaveType->id,
                'start_date'    => $this->nextMonday(),
                'end_date'      => $this->nextMonday(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reason']);
    }

    public function test_apply_rejects_past_start_date(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create();

        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id' => $leaveType->id,
                'start_date'    => '2020-01-01',
                'end_date'      => '2020-01-02',
                'reason'        => 'Test',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start_date']);
    }

    public function test_apply_rejects_weekend_only_range(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create();

        // Find next Saturday
        $saturday = Carbon::now()->next('Saturday')->format('Y-m-d');
        $sunday   = Carbon::now()->next('Sunday')->format('Y-m-d');

        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id' => $leaveType->id,
                'start_date'    => $saturday,
                'end_date'      => $sunday,
                'reason'        => 'Weekend leave',
            ])
            ->assertUnprocessable();
    }

    public function test_apply_half_day_requires_same_start_end(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create(['half_day_allowed' => true]);

        $monday  = $this->nextMonday();
        $tuesday = Carbon::now()->next('Monday')->addDay()->format('Y-m-d');

        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id' => $leaveType->id,
                'start_date'    => $monday,
                'end_date'      => $tuesday,
                'is_half_day'   => true,
                'half_day_type' => 'first_half',
                'reason'        => 'Half day leave',
            ])
            ->assertUnprocessable();
    }

    public function test_apply_half_day_disallowed_leave_type_fails(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create(['half_day_allowed' => false]);

        $monday = $this->nextMonday();

        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id' => $leaveType->id,
                'start_date'    => $monday,
                'end_date'      => $monday,
                'is_half_day'   => true,
                'half_day_type' => 'first_half',
                'reason'        => 'Half day leave',
            ])
            ->assertUnprocessable();
    }

    public function test_overlapping_leave_application_rejected(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create();

        $monday = $this->nextMonday();

        // Create an existing pending leave
        LeaveRequest::factory()->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
            'start_date'    => $monday,
            'end_date'      => $monday,
            'status'        => LeaveStatus::Pending->value,
        ]);

        // Apply overlapping leave
        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id' => $leaveType->id,
                'start_date'    => $monday,
                'end_date'      => $monday,
                'reason'        => 'Duplicate',
            ])
            ->assertUnprocessable();
    }

    // -----------------------------------------------------------------------
    // My leaves
    // -----------------------------------------------------------------------

    public function test_employee_can_view_own_leaves(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create();

        LeaveRequest::factory()->count(3)->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
        ]);

        $this->actingAs($employee, 'api')
            ->getJson('/api/v1/leave-requests/my')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data', 'meta']);
    }

    // -----------------------------------------------------------------------
    // Show
    // -----------------------------------------------------------------------

    public function test_employee_can_view_own_leave_request(): void
    {
        $employee     = $this->employee();
        $leaveRequest = LeaveRequest::factory()->create(['employee_id' => $employee->id]);

        $this->actingAs($employee, 'api')
            ->getJson("/api/v1/leave-requests/{$leaveRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $leaveRequest->id);
    }

    public function test_employee_cannot_view_other_employee_leave(): void
    {
        $employee1 = $this->employee();
        $employee2 = $this->employee();

        $leaveRequest = LeaveRequest::factory()->create(['employee_id' => $employee2->id]);

        $this->actingAs($employee1, 'api')
            ->getJson("/api/v1/leave-requests/{$leaveRequest->id}")
            ->assertForbidden();
    }

    public function test_hr_can_view_any_leave_request(): void
    {
        $hr           = $this->hr();
        $employee     = $this->employee();
        $leaveRequest = LeaveRequest::factory()->create(['employee_id' => $employee->id]);

        $this->actingAs($hr, 'api')
            ->getJson("/api/v1/leave-requests/{$leaveRequest->id}")
            ->assertOk();
    }

    // -----------------------------------------------------------------------
    // Cancel
    // -----------------------------------------------------------------------

    public function test_employee_can_cancel_own_pending_leave(): void
    {
        $employee     = $this->employee();
        $leaveRequest = LeaveRequest::factory()->pending()->create([
            'employee_id' => $employee->id,
        ]);

        $this->actingAs($employee, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/cancel", [
                'cancellation_reason' => 'Changed plans',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_employee_cannot_cancel_rejected_leave(): void
    {
        $employee     = $this->employee();
        $leaveRequest = LeaveRequest::factory()->rejected()->create([
            'employee_id' => $employee->id,
        ]);

        $this->actingAs($employee, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/cancel", [
                'cancellation_reason' => 'Changed plans',
            ])
            ->assertUnprocessable();
    }

    public function test_employee_cannot_cancel_another_employees_leave(): void
    {
        $employee1 = $this->employee();
        $employee2 = $this->employee();

        $leaveRequest = LeaveRequest::factory()->pending()->create([
            'employee_id' => $employee2->id,
        ]);

        $this->actingAs($employee1, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/cancel", [
                'cancellation_reason' => 'Not mine',
            ])
            ->assertForbidden();
    }

    public function test_employee_cannot_cancel_approved_leave(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create(['annual_quota' => 20]);

        $leaveRequest = LeaveRequest::factory()->approved()->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
            'working_days'  => 2,
        ]);

        $this->actingAs($employee, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/cancel", [
                'cancellation_reason' => 'Changed plans',
            ])
            ->assertUnprocessable();
    }

    public function test_non_overlapping_half_days_allowed(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create(['half_day_allowed' => true]);

        $monday = $this->nextMonday();

        // Create an existing approved first_half leave on Monday
        LeaveRequest::factory()->create([
            'employee_id'    => $employee->id,
            'leave_type_id'  => $leaveType->id,
            'start_date'     => $monday,
            'end_date'       => $monday,
            'is_half_day'    => true,
            'half_day_type'  => 'first_half',
            'start_half_day' => 'first_half',
            'end_half_day'   => 'first_half',
            'status'         => LeaveStatus::Approved->value,
        ]);

        // Apply for second_half leave on Monday
        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id'  => $leaveType->id,
                'start_date'     => $monday,
                'end_date'       => $monday,
                'is_half_day'    => true,
                'half_day_type'  => 'second_half',
                'start_half_day' => 'second_half',
                'end_half_day'   => 'second_half',
                'reason'         => 'Medical appointment afternoon',
            ])
            ->assertCreated();
    }

    public function test_overlapping_half_days_rejected(): void
    {
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create(['half_day_allowed' => true]);

        $monday = $this->nextMonday();

        // Create an existing approved first_half leave on Monday
        LeaveRequest::factory()->create([
            'employee_id'    => $employee->id,
            'leave_type_id'  => $leaveType->id,
            'start_date'     => $monday,
            'end_date'       => $monday,
            'is_half_day'    => true,
            'half_day_type'  => 'first_half',
            'start_half_day' => 'first_half',
            'end_half_day'   => 'first_half',
            'status'         => LeaveStatus::Approved->value,
        ]);

        // Apply for another first_half leave on Monday (should fail)
        $this->actingAs($employee, 'api')
            ->postJson('/api/v1/leave-requests', [
                'leave_type_id'  => $leaveType->id,
                'start_date'     => $monday,
                'end_date'       => $monday,
                'is_half_day'    => true,
                'half_day_type'  => 'first_half',
                'start_half_day' => 'first_half',
                'end_half_day'   => 'first_half',
                'reason'         => 'Another morning appointment',
            ])
            ->assertUnprocessable();
    }


    // -----------------------------------------------------------------------
    // Approve / Reject
    // -----------------------------------------------------------------------

    public function test_hr_can_approve_pending_leave(): void
    {
        $hr           = $this->hr();
        $employee     = $this->employee();
        $leaveType    = LeaveType::factory()->create(['annual_quota' => 20, 'negative_limit' => 5]);
        $leaveRequest = LeaveRequest::factory()->pending()->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
            'working_days'  => 2,
        ]);

        $this->actingAs($hr, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/approve", [
                'remarks' => 'Approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_hr_can_reject_pending_leave(): void
    {
        $hr           = $this->hr();
        $employee     = $this->employee();
        $leaveType    = LeaveType::factory()->create();
        $leaveRequest = LeaveRequest::factory()->pending()->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
        ]);

        $this->actingAs($hr, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/reject", [
                'remarks' => 'No reason',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');
    }

    public function test_cannot_approve_already_approved_leave(): void
    {
        $hr        = $this->hr();
        $employee  = $this->employee();
        $leaveType = LeaveType::factory()->create(['annual_quota' => 20, 'negative_limit' => 5]);

        $leaveRequest = LeaveRequest::factory()->approved()->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
        ]);

        $this->actingAs($hr, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/approve")
            ->assertUnprocessable();
    }

    public function test_manager_can_approve_direct_report_leave(): void
    {
        $manager  = $this->manager();
        $employee = User::factory()->employee()->reportsTo($manager)->create();
        $leaveType = LeaveType::factory()->create(['annual_quota' => 20, 'negative_limit' => 5]);

        $leaveRequest = LeaveRequest::factory()->pending()->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
            'working_days'  => 1,
        ]);

        $this->actingAs($manager, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_manager_cannot_approve_non_direct_report_leave(): void
    {
        $manager   = $this->manager();
        $employee  = $this->employee(); // no manager_id set
        $leaveType = LeaveType::factory()->create();

        $leaveRequest = LeaveRequest::factory()->pending()->create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $leaveType->id,
        ]);

        $this->actingAs($manager, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/approve")
            ->assertForbidden();
    }

    public function test_employee_cannot_approve_leave(): void
    {
        $employee     = $this->employee();
        $leaveRequest = LeaveRequest::factory()->pending()->create();

        $this->actingAs($employee, 'api')
            ->postJson("/api/v1/leave-requests/{$leaveRequest->id}/approve")
            ->assertForbidden();
    }

    // -----------------------------------------------------------------------
    // Pending queue
    // -----------------------------------------------------------------------

    public function test_hr_can_list_pending_leaves(): void
    {
        $hr       = $this->hr();
        $employee = $this->employee();

        LeaveRequest::factory()->pending()->count(3)->create([
            'employee_id' => $employee->id,
        ]);

        $this->actingAs($hr, 'api')
            ->getJson('/api/v1/leave-requests/pending')
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    public function test_employee_cannot_access_pending_queue(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/leave-requests/pending')
            ->assertForbidden();
    }

    // -----------------------------------------------------------------------
    // Index (HR all)
    // -----------------------------------------------------------------------

    public function test_hr_can_list_all_leaves(): void
    {
        $hr = $this->hr();

        LeaveRequest::factory()->count(5)->create();

        $this->actingAs($hr, 'api')
            ->getJson('/api/v1/leave-requests')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_employee_cannot_list_all_leaves(): void
    {
        $this->actingAs($this->employee(), 'api')
            ->getJson('/api/v1/leave-requests')
            ->assertForbidden();
    }
}
