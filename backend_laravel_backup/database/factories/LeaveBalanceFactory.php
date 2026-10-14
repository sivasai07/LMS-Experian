<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\LeaveBalance;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for LeaveBalance model.
 *
 * @extends Factory<LeaveBalance>
 */
class LeaveBalanceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = LeaveBalance::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id'   => User::factory(),
            'year'      => (int) date('Y'),
            'allocated' => 20.00,
            'used'      => 0.00,
            'balance'   => 20.00,
        ];
    }

    /**
     * State helper for custom allocation and usage.
     */
    public function custom(float $allocated, float $used): static
    {
        return $this->state(fn () => [
            'allocated' => $allocated,
            'used'      => $used,
            'balance'   => $allocated - $used,
        ]);
    }
}
