<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Traits\ApiResponseTrait;

/**
 * Class Controller
 *
 * Base controller for all application HTTP controllers.
 *
 * Responsibilities:
 * - Provides shared controller functionality.
 * - Exposes standardized API response helpers through ApiResponseTrait.
 * - Acts as the parent class for all application controllers.
 *
 * Design:
 * - Contains no business logic.
 * - Shared behaviors should be introduced through reusable traits,
 *   middleware, or service classes.
 */
abstract class Controller
{
    use ApiResponseTrait;
}