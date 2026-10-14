<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enum representing supported human blood groups.
 *
 * This enum provides strongly typed blood group values and
 * human-readable labels for display purposes.
 */
enum BloodGroup: string
{
    /**
     * Blood group A positive.
     */
    case APositive = 'A+';

    /**
     * Blood group A negative.
     */
    case ANegative = 'A-';

    /**
     * Blood group B positive.
     */
    case BPositive = 'B+';

    /**
     * Blood group B negative.
     */
    case BNegative = 'B-';

    /**
     * Blood group AB positive.
     */
    case ABPositive = 'AB+';

    /**
     * Blood group AB negative.
     */
    case ABNegative = 'AB-';

    /**
     * Blood group O positive.
     */
    case OPositive = 'O+';

    /**
     * Blood group O negative.
     */
    case ONegative = 'O-';

    /**
     * Get a human-readable label for the blood group.
     *
     * @return string The formatted blood group name.
     */
    public function label(): string
    {
        return match ($this) {
            self::APositive => 'A Positive',
            self::ANegative => 'A Negative',
            self::BPositive => 'B Positive',
            self::BNegative => 'B Negative',
            self::ABPositive => 'AB Positive',
            self::ABNegative => 'AB Negative',
            self::OPositive => 'O Positive',
            self::ONegative => 'O Negative',
        };
    }
}