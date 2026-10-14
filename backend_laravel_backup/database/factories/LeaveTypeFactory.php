<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\LeaveType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveType>
 */
class LeaveTypeFactory extends Factory
{
    protected $model = LeaveType::class;

    public function definition(): array
    {
        return [
            'name' => ucfirst($this->faker->unique()->word()) . ' Leave',
            'annual_quota' => $this->faker->randomFloat(2, 5, 30),
            'negative_limit' => $this->faker->randomFloat(2, 0, 5),
            'half_day_allowed' => $this->faker->boolean(80),
            'description' => $this->faker->sentence(),
        ];
    }
}
