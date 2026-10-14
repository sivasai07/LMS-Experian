<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enum representing different employment types.
 *
 * Provides strongly typed employment status values and
 * human-readable labels for display purposes.
 */
enum EmploymentType: string
{
    /**
     * Represents a full-time employment type.
     */
    case FullTime = 'full_time';

    /**
     * Represents a part-time employment type.
     */
    case PartTime = 'part_time';

    /**
     * Represents a contractual employment type.
     */
    case Contract = 'contract';

    /**
     * Represents an internship employment type.
     */
    case Intern = 'intern';

    /**
     * Get a human-readable label for the employment type.
     *
     * @return string The formatted employment type label.
     */
    public function label(): string
    {
        return match ($this) {
            self::FullTime => 'Full-time',
            self::PartTime => 'Part-time',
            self::Contract => 'Contract',
            self::Intern => 'Intern',
        };
    }
}