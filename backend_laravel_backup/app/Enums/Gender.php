<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enum representing available gender options.
 *
 * Provides strongly typed gender values along with
 * human-readable labels for presentation purposes.
 */
enum Gender: string
{
    /**
     * Represents the male gender option.
     */
    case Male = 'male';

    /**
     * Represents the female gender option.
     */
    case Female = 'female';

    /**
     * Represents another gender option.
     */
    case Other = 'other';

    /**
     * Represents the option where a user chooses not to disclose gender.
     */
    case PreferNotToSay = 'prefer_not_to_say';

    /**
     * Get a human-readable label for the gender option.
     *
     * @return string The formatted gender label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Male => 'Male',
            self::Female => 'Female',
            self::Other => 'Other',
            self::PreferNotToSay => 'Prefer not to say',
        };
    }
}