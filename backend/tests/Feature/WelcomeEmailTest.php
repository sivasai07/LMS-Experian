<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Mail\WelcomeEmployeeMail;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WelcomeEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_email_is_sent_when_hr_creates_user(): void
    {
        Mail::fake();

        $hrRole = Role::where('name', 'HR')->first() ?? Role::factory()->create(['name' => 'HR']);
        $empRole = Role::where('name', 'Employee')->first() ?? Role::factory()->create(['name' => 'Employee']);
        $dept = Department::factory()->create();
        $gjt  = \App\Models\GradeJobTitle::factory()->create();

        $hrUser = User::factory()->create([
            'role_id' => $hrRole->id,
        ]);

        $userData = [
            'first_name'         => 'John',
            'last_name'          => 'Doe',
            'email'              => 'john.doe@example.com',
            'password'           => 'SecretPass123!',
            'employee_number'    => 'EMP99999',
            'role_id'            => $empRole->id,
            'department_id'      => $dept->id,
            'grade_job_title_id' => $gjt->id,
            'joining_date'       => '2026-08-01',
            'status'             => 'active',
        ];

        $response = $this->actingAs($hrUser, 'api')
            ->postJson('/api/v1/users', $userData);

        $response->assertCreated();

        Mail::assertQueued(WelcomeEmployeeMail::class);
    }
}
