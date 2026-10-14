<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Grade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grade>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;

    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->randomElement([
                'G0',
                'G1',
                'G2',
                'G3',
                'G4',
                'G5',
                'G6',
                'M1',
                'M2',
                'M3',
                'M4',
                'M5',
                'M6',
                'D1',
                'D2',
                'D3',
                'D4',
                'D5',
                'P1',
                'P2',
                'P3',
                'P4',
                'P5',
            ]),
            'description' => $this->faker->sentence(),
        ];
    }
}
