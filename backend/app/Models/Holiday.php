<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Holiday
 *
 * Represents company holiday master data.
 *
 * Responsibilities:
 * - Stores official holiday information used across the leave management system.
 * - Provides attribute casting for consistent date handling.
 * - Defines mass-assignable holiday fields.
 *
 * Design:
 * - Holiday validation and business rules remain within the service/domain layer.
 * - This model handles database representation and attribute configuration.
 */
class Holiday extends Model
{
    use HasFactory;

    /**
     * Attributes that can be mass assigned.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'holiday_name',
        'holiday_date',
        'description',
    ];

    /**
     * Get attribute casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'holiday_date' => 'date',
        ];
    }
}