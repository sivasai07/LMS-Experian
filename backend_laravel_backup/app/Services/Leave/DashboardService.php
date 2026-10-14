<?php

declare(strict_types=1);

namespace App\Services\Leave;

use App\Enums\LeaveStatus;
use App\Models\Department;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Service: DashboardService
 *
 * Compiles aggregated dashboard statistics and indicators for Employee,
 * Manager, and HR roles, optimized for React dashboard cards and charts.
 */
class DashboardService
{
    public function __construct(
        private readonly LeaveBalanceService $balanceService,
    ) {
    }

    /**
     * Employee Dashboard Metrics:
     * - Total Leave Allocation
     * - Used Leave
     * - Available Leave
     * - Pending Requests
     * - Approved Requests
     * - Rejected Requests
     * - Recent Leave Requests
     *
     * @return array<string, mixed>
     */
    public function employee(): array
    {
        /** @var User $user */
        $user        = JWTAuth::user();
        $currentYear = (int) now()->year;

        $balance = $this->balanceService->getOrCreate($user->id, $currentYear);

        $pendingCount = LeaveRequest::where('employee_id', $user->id)
            ->where('status', LeaveStatus::Pending->value)
            ->count();

        $approvedCount = LeaveRequest::where('employee_id', $user->id)
            ->where('status', LeaveStatus::Approved->value)
            ->count();

        $rejectedCount = LeaveRequest::where('employee_id', $user->id)
            ->where('status', LeaveStatus::Rejected->value)
            ->count();

        $recentLeaves = LeaveRequest::with('leaveType')
            ->where('employee_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $upcomingHolidays = Holiday::where('holiday_date', '>=', now()->toDateString())
            ->orderBy('holiday_date')
            ->limit(5)
            ->get();

        return [
            'total_leaves'      => (float) $balance->allocated,
            'used_leaves'       => (float) $balance->used,
            'available_leaves'  => (float) $balance->balance,

            'pending_requests'  => $pendingCount,
            'approved_requests' => $approvedCount,
            'rejected_requests' => $rejectedCount,

            'leave_balances'    => [
                [
                    'allocated' => (float) $balance->allocated,
                    'used'      => (float) $balance->used,
                    'balance'   => (float) $balance->balance,
                    'year'      => $balance->year,
                ],
            ],

            'recent_leaves'     => $recentLeaves->map(fn ($l) => [
                'id'           => $l->id,
                'leave_type'   => $l->leaveType?->name,
                'start_date'   => $l->start_date?->format('Y-m-d'),
                'end_date'     => $l->end_date?->format('Y-m-d'),
                'working_days' => (float) $l->working_days,
                'status'       => $l->status?->value,
            ])->values(),

            'upcoming_holidays' => $upcomingHolidays->map(fn ($h) => [
                'id'           => $h->id,
                'holiday_name' => $h->holiday_name,
                'holiday_date' => $h->holiday_date?->format('Y-m-d'),
            ])->values(),
        ];
    }

    /**
     * Manager Dashboard Metrics:
     * - Pending Approvals
     * - Team Members
     * - Team Leave Summary
     * - Upcoming Leaves / Team on leave today
     *
     * @return array<string, mixed>
     */
    public function manager(): array
    {
        /** @var User $manager */
        $manager = JWTAuth::user();

        $reportIds = $manager->directReports()->pluck('id')->toArray();

        $pendingCount = LeaveRequest::whereIn('employee_id', $reportIds)
            ->where('status', LeaveStatus::Pending->value)
            ->count();

        $approvedCount = LeaveRequest::whereIn('employee_id', $reportIds)
            ->where('status', LeaveStatus::Approved->value)
            ->count();

        $rejectedCount = LeaveRequest::whereIn('employee_id', $reportIds)
            ->where('status', LeaveStatus::Rejected->value)
            ->count();

        $pendingLeaves = LeaveRequest::with(['employee', 'leaveType'])
            ->whereIn('employee_id', $reportIds)
            ->where('status', LeaveStatus::Pending->value)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $teamOnLeaveToday = LeaveRequest::with(['employee', 'leaveType'])
            ->whereIn('employee_id', $reportIds)
            ->where('status', LeaveStatus::Approved->value)
            ->where('start_date', '<=', now()->toDateString())
            ->where('end_date', '>=', now()->toDateString())
            ->get();

        $upcomingLeaves = LeaveRequest::with(['employee', 'leaveType'])
            ->whereIn('employee_id', $reportIds)
            ->where('status', LeaveStatus::Approved->value)
            ->where('start_date', '>', now()->toDateString())
            ->orderBy('start_date')
            ->limit(5)
            ->get();

        return [
            'team_size'         => count($reportIds),
            'pending_approvals' => $pendingCount,
            'team_leave_summary' => [
                'pending'  => $pendingCount,
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
            ],
            'team_on_leave_today' => $teamOnLeaveToday->map(fn ($l) => [
                'employee_name' => $l->employee?->first_name . ' ' . $l->employee?->last_name,
                'leave_type'    => $l->leaveType?->name ?? '',
                'start_date'    => $l->start_date?->format('Y-m-d'),
                'end_date'      => $l->end_date?->format('Y-m-d'),
            ])->values(),
            'upcoming_leaves'     => $upcomingLeaves->map(fn ($l) => [
                'employee_name' => $l->employee?->first_name . ' ' . $l->employee?->last_name,
                'leave_type'    => $l->leaveType?->name ?? '',
                'start_date'    => $l->start_date?->format('Y-m-d'),
                'end_date'      => $l->end_date?->format('Y-m-d'),
            ])->values(),
            'pending_requests'    => $pendingLeaves->map(fn ($l) => [
                'id'            => $l->id,
                'employee_name' => $l->employee?->first_name . ' ' . $l->employee?->last_name,
                'leave_type'    => $l->leaveType?->name,
                'start_date'    => $l->start_date?->format('Y-m-d'),
                'end_date'      => $l->end_date?->format('Y-m-d'),
                'working_days'  => (float) $l->working_days,
            ])->values(),
        ];
    }

    /**
     * HR Dashboard Metrics:
     * - Total Employees
     * - Active Employees
     * - Company Leave Summary
     * - Department-wise Leave Summary
     * - Pending Requests
     * - Approved Requests
     * - Rejected Requests
     *
     * @return array<string, mixed>
     */
    public function hr(): array
    {
        $currentYear = (int) now()->year;

        $totalEmployees  = User::withoutTrashed()->count();
        $activeEmployees = User::withoutTrashed()->where('status', 'active')->count();

        $pendingCount  = LeaveRequest::where('status', LeaveStatus::Pending->value)->count();
        $approvedCount = LeaveRequest::where('status', LeaveStatus::Approved->value)->count();
        $rejectedCount = LeaveRequest::where('status', LeaveStatus::Rejected->value)->count();

        $onLeaveToday = LeaveRequest::where('status', LeaveStatus::Approved->value)
            ->where('start_date', '<=', now()->toDateString())
            ->where('end_date', '>=', now()->toDateString())
            ->count();

        // Department-wise leave summary (optimized single query)
        $deptLeaveTotals = DB::table('users')
            ->join('leave_requests', 'users.id', '=', 'leave_requests.employee_id')
            ->whereNull('users.deleted_at')
            ->where('leave_requests.status', LeaveStatus::Approved->value)
            ->whereYear('leave_requests.start_date', $currentYear)
            ->groupBy('users.department_id')
            ->select('users.department_id', DB::raw('SUM(leave_requests.working_days) as total_days'))
            ->pluck('total_days', 'department_id');

        $deptSummary = Department::withCount([
            'users as employee_count' => fn ($q) => $q->withoutTrashed(),
        ])->get()->map(function ($d) use ($deptLeaveTotals) {
            $totalDays = (float) ($deptLeaveTotals[$d->id] ?? 0);

            return [
                'id'                 => $d->id,
                'name'               => $d->name,
                'code'               => $d->code ?? null,
                'employee_count'     => (int) $d->employee_count,
                'total_leaves_taken' => $totalDays,
            ];
        })->values();

        $recentRequests = LeaveRequest::with(['employee', 'leaveType'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $upcomingHolidays = Holiday::where('holiday_date', '>=', now()->toDateString())
            ->orderBy('holiday_date')
            ->limit(5)
            ->get();

        return [
            'total_employees'    => $totalEmployees,
            'active_employees'   => $activeEmployees,
            'pending_requests'   => $pendingCount,
            'approved_requests'  => $approvedCount,
            'approved_this_year' => $approvedCount,
            'rejected_requests'  => $rejectedCount,
            'on_leave_today'     => $onLeaveToday,
            'company_leave_summary' => [
                'pending'  => $pendingCount,
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
            ],
            'department_leave_summary' => $deptSummary,
            'recent_requests'    => $recentRequests->map(fn ($l) => [
                'id'            => $l->id,
                'employee_name' => $l->employee?->first_name . ' ' . $l->employee?->last_name,
                'leave_type'    => $l->leaveType?->name,
                'start_date'    => $l->start_date?->format('Y-m-d'),
                'end_date'      => $l->end_date?->format('Y-m-d'),
                'working_days'  => (float) $l->working_days,
                'status'        => $l->status?->value,
            ])->values(),
            'upcoming_holidays'  => $upcomingHolidays->map(fn ($h) => [
                'id'           => $h->id,
                'holiday_name' => $h->holiday_name,
                'holiday_date' => $h->holiday_date?->format('Y-m-d'),
            ])->values(),
        ];
    }
}

