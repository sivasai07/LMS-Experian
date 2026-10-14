<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class LeaveBalance
 *
 * Represents an employee's annual common leave balance.
 *
 * Responsibilities:
 * - Stores yearly leave allocation and usage information for employees.
 * - Maintains the calculated available leave balance.
 * - Provides relationship access to the owning employee.
 *
 * Business Rules:
 * - Each employee has a single common annual leave balance per calendar year.
 * - Initial annual allocation is 20 days.
 * - Approved leaves across all leave categories reduce this balance.
 * - Balance calculation and negative balance rules are handled by the service/domain layer.
 *
 * Design:
 * - This model handles database representation, casting, and relationships only.
 * - Leave calculation and approval workflows remain outside the model layer.
 *
 * @property int $id
 * @property int $user_id
 * @property int $year
 * @property float $allocated
 * @property float $used
 * @property float $balance
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read User $user
 */
class LeaveBalance extends Model
{
    use HasFactory;

    /**
     * Attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'year',
        'allocated',
        'used',
        'balance',
    ];

    /**
     * Get attribute casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'allocated' => 'decimal:2',
            'used' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    /**
     * Get the employee associated with this leave balance.
     *
     * @return BelongsTo<User, LeaveBalance>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}