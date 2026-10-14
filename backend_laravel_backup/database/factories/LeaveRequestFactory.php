<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\HalfDayType;
use App\Enums\LeaveStatus;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveRequest>
 */
class LeaveRequestFactory extends Factory
{
    protected $model = LeaveRequest::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('+1 day', '+2 months');
        $end = (clone $start)->modify(
            '+' . $this->faker->numberBetween(0, 4) . ' days'
        );

        return [
            'employee_id' => User::factory(),
            'leave_type_id' => LeaveType::factory(),

            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),

            // Factory calculation only.
            // Actual calculation should happen through LeaveCalculationService.
            'working_days' => $start->diff($end)->days + 1,

            'is_half_day' => false,
            'half_day_type' => null,

            'reason' => $this->faker->sentence(),

            'status' => LeaveStatus::Pending->value,

            'is_active' => true,

            'processed_by' => null,
            'processed_at' => null,

            'remarks' => null,

            'cancelled_by' => null,
            'cancelled_at' => null,
            'cancellation_reason' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (): array => [
            'status' => LeaveStatus::Pending->value,
            'is_active' => true,
            'processed_by' => null,
            'processed_at' => null,
        ]);
    }

    public function approved(User|int|null $approver = null): static
    {
        return $this->state(fn (): array => [
            'status' => LeaveStatus::Approved->value,
            'is_active' => true,
            'processed_by' => $approver instanceof User
                ? $approver->id
                : ($approver ?? User::factory()),
            'processed_at' => now(),
        ]);
    }

    public function rejected(User|int|null $processor = null): static
    {
        return $this->state(fn (): array => [
            'status' => LeaveStatus::Rejected->value,
            'is_active' => false,
            'processed_by' => $processor instanceof User
                ? $processor->id
                : ($processor ?? User::factory()),
            'processed_at' => now(),
            'remarks' => $this->faker->sentence(),
        ]);
    }

    public function cancelled(User|int|null $canceller = null): static
    {
        $cancellerId = $canceller instanceof User
            ? $canceller->id
            : ($canceller ?? User::factory());

        return $this->state(fn (): array => [
            'status' => LeaveStatus::Cancelled->value,
            'is_active' => false,

            'processed_by' => $cancellerId,
            'processed_at' => now()->subDay(),

            'cancelled_by' => $cancellerId,
            'cancelled_at' => now(),

            'cancellation_reason' => $this->faker->sentence(),
        ]);
    }

    public function halfDay(
        HalfDayType $type = HalfDayType::FirstHalf
    ): static {
        return $this->state(fn (array $attributes): array => [
            'is_half_day' => true,
            'half_day_type' => $type->value,
            'working_days' => 0.5,
            'end_date' => $attributes['start_date'],
        ]);
    }
}
