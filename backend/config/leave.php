<?php

declare(strict_types=1);

return [
    /*
     * The monthly rate at which employees accrue leave days.
     * Default: 1.67 days per month.
     */
    'monthly_accrual_rate' => 1.67,

    /*
     * The maximum number of unused leave days that can be carried forward to the next year.
     * Default: 5.0 days.
     */
    'max_carry_forward' => 5.0,

    /*
     * The maximum negative leave balance an employee is allowed to accrue.
     * Default: 5.0 days (meaning a balance can drop down to -5.0 days).
     */
    'max_negative_balance' => 5.0,
];
