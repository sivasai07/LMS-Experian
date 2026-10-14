<?php

declare(strict_types=1);

use App\Http\Controllers\API\Auth\AuthController;
use App\Http\Controllers\API\Leave\DashboardController;
use App\Http\Controllers\API\Leave\HolidayController;
use App\Http\Controllers\API\Leave\LeaveBalanceController;
use App\Http\Controllers\API\Leave\LeaveRequestController;
use App\Http\Controllers\API\Leave\LeaveTypeController;
use App\Http\Controllers\API\Master\DepartmentController;
use App\Http\Controllers\API\Master\GradeController;
use App\Http\Controllers\API\Master\GradeJobTitleController;
use App\Http\Controllers\API\Master\JobTitleController;
use App\Http\Controllers\API\Master\RoleController;
use App\Http\Controllers\API\User\ProfileController;
use App\Http\Controllers\API\User\TeamController;
use App\Http\Controllers\API\User\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Version 1
|--------------------------------------------------------------------------
|
| All API endpoints are grouped under /api/v1.
| Authentication is handled through JWT middleware.
|
*/
Route::prefix('v1')->middleware('api')->group(function (): void {


    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | Public:
    |   - Login
    |
    | Protected:
    |   - Logout
    |   - Token refresh
    |   - Current user details
    |   - Password management
    |
    */
    Route::prefix('auth')->group(function (): void {

        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:api')->group(function (): void {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('refresh', [AuthController::class, 'refresh']);
            Route::get('me', [AuthController::class, 'me']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });
    });


    /*
    |--------------------------------------------------------------------------
    | Authenticated Application Routes
    |--------------------------------------------------------------------------
    |
    | All routes below require a valid JWT token.
    |
    */
    Route::middleware('auth:api')->group(function (): void {


        /*
        |--------------------------------------------------------------------------
        | User Management
        |--------------------------------------------------------------------------
        |
        | Access:
        |   Profile:
        |       Available to all authenticated users.
        |
        |   Team information:
        |       Available to HR and Managers.
        |
        |   User administration:
        |       HR only.
        |
        */
        Route::prefix('users')->group(function (): void {


            // Employee self-service profile management
            Route::get('profile', [ProfileController::class, 'show']);
            Route::put('profile', [ProfileController::class, 'update']);


            // Organization hierarchy and team visibility
            Route::middleware('role:HR,Manager')->group(function (): void {
                Route::get('direct-reports', [TeamController::class, 'directReports']);
                Route::get('managers', [TeamController::class, 'managers']);
                Route::get('employees', [TeamController::class, 'employees']);
            });


            // HR administration: employee lifecycle management
            Route::middleware('role:HR')->group(function (): void {

                Route::get('/', [UserController::class, 'index']);
                Route::post('/', [UserController::class, 'store']);
                Route::get('{id}/leave-balances', [LeaveBalanceController::class, 'forUser']);

                Route::get('{id}', [UserController::class, 'show']);
                Route::put('{id}', [UserController::class, 'update']);

                // Soft delete and restore employee accounts
                Route::delete('{id}', [UserController::class, 'destroy']);
                Route::post('{id}/restore', [UserController::class, 'restore']);
            });
        });


        /*
        |--------------------------------------------------------------------------
        | Master Data Management
        |--------------------------------------------------------------------------
        |
        | Read:
        |   Available to authenticated users.
        |
        | Write:
        |   Restricted to HR users.
        |
        | Includes:
        |   - Departments
        |   - Grades
        |   - Job Titles
        |
        */
        Route::prefix('departments')->group(function (): void {
            Route::get('/', [DepartmentController::class, 'index']);
            Route::get('{id}', [DepartmentController::class, 'show'])->whereNumber('id');

            Route::middleware('role:HR')->group(function (): void {
                Route::post('/', [DepartmentController::class, 'store']);
                Route::put('{id}', [DepartmentController::class, 'update'])->whereNumber('id');
                Route::delete('{id}', [DepartmentController::class, 'destroy'])->whereNumber('id');
            });
        });

        Route::prefix('grades')->group(function (): void {
            Route::get('/', [GradeController::class, 'index']);
            Route::get('{id}', [GradeController::class, 'show'])->whereNumber('id');

            Route::middleware('role:HR')->group(function (): void {
                Route::post('/', [GradeController::class, 'store']);
                Route::put('{id}', [GradeController::class, 'update'])->whereNumber('id');
                Route::delete('{id}', [GradeController::class, 'destroy'])->whereNumber('id');
            });
        });

        Route::prefix('job-titles')->group(function (): void {
            Route::get('/', [JobTitleController::class, 'index']);
            Route::get('{id}', [JobTitleController::class, 'show'])->whereNumber('id');

            Route::middleware('role:HR')->group(function (): void {
                Route::post('/', [JobTitleController::class, 'store']);
                Route::put('{id}', [JobTitleController::class, 'update'])->whereNumber('id');
                Route::delete('{id}', [JobTitleController::class, 'destroy'])->whereNumber('id');
            });
        });

        // Grade–Job-Title combinations (read-only — HR uses when creating/editing employees)
        Route::get('grade-job-titles', [GradeJobTitleController::class, 'index']);

        // Roles (read-only lookup for HR employee form)
        Route::get('roles', [RoleController::class, 'index']);


        /*
        |--------------------------------------------------------------------------
        | Leave Management
        |--------------------------------------------------------------------------
        |
        | Handles leave configuration, requests, approvals, and balances.
        |
        */
        Route::prefix('leave-types')->group(function (): void {

            Route::get('/', [LeaveTypeController::class, 'index']);
            Route::get('{id}', [LeaveTypeController::class, 'show']);

            Route::middleware('role:HR')->group(function (): void {
                Route::post('/', [LeaveTypeController::class, 'store']);
                Route::put('{id}', [LeaveTypeController::class, 'update']);
                Route::delete('{id}', [LeaveTypeController::class, 'destroy']);
            });
        });


        Route::prefix('holidays')->group(function (): void {

            Route::get('/', [HolidayController::class, 'index']);
            Route::get('{id}', [HolidayController::class, 'show']);

            Route::middleware('role:HR')->group(function (): void {
                Route::post('/', [HolidayController::class, 'store']);
                Route::put('{id}', [HolidayController::class, 'update']);
                Route::delete('{id}', [HolidayController::class, 'destroy']);
            });
        });


        /*
        |--------------------------------------------------------------------------
        | Leave Requests Workflow
        |--------------------------------------------------------------------------
        |
        | Employee:
        |   Apply, view and cancel own requests.
        |
        | Manager / HR:
        |   Review pending requests and approve/reject.
        |
        */
        Route::prefix('leave-requests')->group(function (): void {

            Route::get('my', [LeaveRequestController::class, 'my']);

            Route::middleware('role:HR,Manager')->group(function (): void {
                Route::get('pending', [LeaveRequestController::class, 'pending']);
            });

            Route::middleware('role:HR')->group(function (): void {
                Route::get('/', [LeaveRequestController::class, 'index']);
            });

            Route::post('/', [LeaveRequestController::class, 'apply']);
            Route::get('{id}', [LeaveRequestController::class, 'show']);
            Route::post('{id}/cancel', [LeaveRequestController::class, 'cancel']);

            // Route::middleware('role:HR,Manager')->group(function (): void {
            //     Route::post('{id}/approve', [LeaveRequestController::class, 'approve']);
            //     Route::post('{id}/reject', [LeaveRequestController::class, 'reject']);
            // });
            // Authorization for approve/reject is ownership-based (assigned
            // manager, or HR) and enforced inside LeaveRequestService — not
            // role-gated here, since a role=Employee user can still be
            // someone's manager_id. See LeaveRequestService::approve()/reject().
            Route::post('{id}/approve', [LeaveRequestController::class, 'approve']);
            Route::post('{id}/reject', [LeaveRequestController::class, 'reject']);
        });


        /*
        |--------------------------------------------------------------------------
        | Leave Balance
        |--------------------------------------------------------------------------
        |
        | Employee can view their own leave balance.
        |
        */
        Route::get('leave-balances/my', [LeaveBalanceController::class, 'my']);


        /*
        |--------------------------------------------------------------------------
        | Dashboards
        |--------------------------------------------------------------------------
        |
        | Role-based dashboards:
        |
        | Employee:
        |   Personal leave information.
        |
        | Manager:
        |   Team overview and approvals.
        |
        | HR:
        |   Organization-wide statistics.
        |
        */
        Route::prefix('dashboard')->group(function (): void {

            Route::get('employee', [DashboardController::class, 'employee']);

            Route::middleware('role:HR,Manager')->group(function (): void {
                Route::get('manager', [DashboardController::class, 'manager']);
            });

            Route::middleware('role:HR')->group(function (): void {
                Route::get('hr', [DashboardController::class, 'hr']);
            });
        });
    });
});
