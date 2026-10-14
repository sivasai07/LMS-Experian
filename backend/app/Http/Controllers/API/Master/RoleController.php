<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Master;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;

/**
 * Read-only endpoint that returns all application roles.
 * Used by HR when assigning roles to employees.
 *
 * GET /api/v1/roles
 */
class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::orderBy('name')->get(['id', 'name', 'description']);

        return $this->success($roles);
    }
}
