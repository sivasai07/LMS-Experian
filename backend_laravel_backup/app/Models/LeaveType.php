<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a leave category.
 *
 * Leave types define available leave classifications such as Sick Leave,
 * Casual Leave, Vacation Leave, and Other Leave. They are used for
 * categorization, reporting, filtering, and analytics purposes.
 *
 * Leave balances are maintained at the employee level and are not separated
 * by leave type.
 *
 * @property int $id
 * @property string $name
 * @property float $annual_quota
 * @property float $negative_limit
 * @property bool $half_day_allowed
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, LeaveRequest> $leaveRequests
 */
class LeaveType extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'annual_quota',
        'negative_limit',
        'half_day_allowed',
        'description',
    ];

    /**
     * Get the attribute casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'annual_quota' => 'decimal:2',
            'negative_limit' => 'decimal:2',
            'half_day_allowed' => 'boolean',
        ];
    }

    /**
     * Get leave requests associated with this leave type.
     *
     * @return HasMany<LeaveRequest>
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}