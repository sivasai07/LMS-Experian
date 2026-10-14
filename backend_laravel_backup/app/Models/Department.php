<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class Department
 *
 * Represents an organizational department within the system.
 *
 * Responsibilities:
 * - Stores department master data.
 * - Defines relationships with employees assigned to the department.
 * - Provides mass-assignment protection for department attributes.
 *
 * Design:
 * - Business rules related to departments remain within the service/domain layer.
 * - This model handles database representation and relationship definitions.
 */
class Department extends Model
{
    use HasFactory;

    /**
     * Attributes that can be mass assigned.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get employees belonging to this department.
     *
     * @return HasMany<User, Department>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}