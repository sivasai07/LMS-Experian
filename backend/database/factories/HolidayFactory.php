<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Holiday;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Holiday>
 */
class HolidayFactory extends Factory
{
    protected $model = Holiday::class;

    public function definition(): array
    {
        return [
            'holiday_name' => ucfirst($this->faker->unique()->word()) . ' Day',
            'holiday_date' => $this->faker->dateTimeBetween('-1 month', '+6 months')->format('Y-m-d'),
            'description' => $this->faker->sentence(),
        ];
    }
}
