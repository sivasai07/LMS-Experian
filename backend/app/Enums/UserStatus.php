<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enum representing the employment lifecycle status of a user.
 *
 * The values are stored as strings rather than database-level enums,
 * allowing new statuses to be introduced without requiring migrations.
 */
enum UserStatus: string
{
    /**
     * Represents an active user account.
     */
    case Active = 'active';

    /**
     * Represents an inactive user account.
     */
    case Inactive = 'inactive';

    /**
     * Represents a terminated user account.
     */
    case Terminated = 'terminated';

    /**
     * Get a human-readable label for the user status.
     *
     * @return string The formatted user status label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
            self::Terminated => 'Terminated',
        };
    }
}