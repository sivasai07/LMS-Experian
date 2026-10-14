<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\BloodGroup;
use App\Enums\EmploymentType;
use App\Enums\Gender;
use App\Enums\UserStatus;
use App\Models\Department;
use App\Models\GradeJobTitle;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * Cache password hash to avoid repeated bcrypt calls.
     */
    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'employee_number' => (string) $this->faker
                ->unique()
                ->numberBetween(1111, 999999),

            'first_name' => $this->faker->firstName(),

            'last_name' => $this->faker->lastName(),

            'email' => $this->faker
                ->unique()
                ->safeEmail(),

            'personal_email' => null,

            'phone' => $this->faker->numerify('##########'),

            'password' => static::$password ??= Hash::make('Password@123'),

            'gender' => $this->faker
                ->randomElement(Gender::cases())
                ->value,

            'dob' => $this->faker
                ->dateTimeBetween('-45 years', '-22 years')
                ->format('Y-m-d'),

            'blood_group' => $this->faker
                ->randomElement(BloodGroup::cases())
                ->value,

            'address' => $this->faker->address(),

            'emergency_contact' => $this->faker
                ->numerify('##########'),

            'profile_photo' => null,

            'joining_date' => $this->faker
                ->dateTimeBetween('-3 years', 'now')
                ->format('Y-m-d'),

            'relieving_date' => null,

            'status' => UserStatus::Active->value,

            'employment_type' => EmploymentType::FullTime->value,

            'force_password_change' => false,

            'role_id' => Role::factory(),

            'department_id' => Department::factory(),

            'grade_job_title_id' => GradeJobTitle::factory(),

            'manager_id' => null,
        ];
    }


    public function hr(): static
    {
        return $this->state(fn () => [
            'role_id' => Role::query()
                ->firstOrCreate(['name' => 'HR'])
                ->id,
        ]);
    }


    public function manager(): static
    {
        return $this->state(fn () => [
            'role_id' => Role::query()
                ->firstOrCreate(['name' => 'Manager'])
                ->id,
        ]);
    }


    public function employee(): static
    {
        return $this->state(fn () => [
            'role_id' => Role::query()
                ->firstOrCreate(['name' => 'Employee'])
                ->id,
        ]);
    }


    public function reportsTo(User|int $manager): static
    {
        return $this->state(fn () => [
            'manager_id' => $manager instanceof User
                ? $manager->id
                : $manager,
        ]);
    }


    public function forcedPasswordChange(): static
    {
        return $this->state(fn () => [
            'force_password_change' => true,
        ]);
    }


    public function terminated(): static
    {
        return $this->state(fn () => [
            'status' => UserStatus::Terminated->value,

            'relieving_date' => $this->faker
                ->dateTimeBetween('-6 months', 'now')
                ->format('Y-m-d'),
        ]);
    }
}
