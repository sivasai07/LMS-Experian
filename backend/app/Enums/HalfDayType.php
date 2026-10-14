<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enum representing half-day leave/session options.
 *
 * Provides strongly typed half-day values along with
 * human-readable labels for display purposes.
 */
enum HalfDayType: string
{
    /**
     * Represents the first half of the day.
     */
    case FirstHalf = 'first_half';

    /**
     * Represents the second half of the day.
     */
    case SecondHalf = 'second_half';

    /**
     * Get a human-readable label for the half-day type.
     *
     * @return string The formatted half-day label.
     */
    public function label(): string
    {
        return match ($this) {
            self::FirstHalf => 'First Half',
            self::SecondHalf => 'Second Half',
        };
    }
}