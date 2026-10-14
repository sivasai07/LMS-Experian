import { Op } from 'sequelize';
import dayjs from 'dayjs';
import sequelize from '../config/database.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Holiday from '../models/Holiday.js';
import leaveBalanceService from './leaveBalanceService.js';

export class DashboardService {
  /**
   * Employee Dashboard Metrics
   *
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  async employee(user) {
    const currentYear = dayjs().year();
    const todayStr = dayjs().format('YYYY-MM-DD');

    const balance = await leaveBalanceService.getOrCreate(user.id, currentYear);

    const pendingCount = await LeaveRequest.count({
      where: {
        employee_id: user.id,
        status: 'pending',
      },
    });

    const approvedCount = await LeaveRequest.count({
      where: {
        employee_id: user.id,
        status: 'approved',
      },
    });

    const rejectedCount = await LeaveRequest.count({
      where: {
        employee_id: user.id,
        status: 'rejected',
      },
    });

    const recentLeaves = await LeaveRequest.findAll({
      where: { employee_id: user.id },
      include: [{ model: LeaveType, as: 'leaveType' }],
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    const upcomingHolidays = await Holiday.findAll({
      where: {
        holiday_date: {
          [Op.gte]: todayStr,
        },
      },
      order: [['holiday_date', 'ASC']],
      limit: 5,
    });

    return {
      total_leaves: parseFloat(balance.allocated),
      used_leaves: parseFloat(balance.used),
      available_leaves: parseFloat(balance.balance),

      pending_requests: pendingCount,
      approved_requests: approvedCount,
      rejected_requests: rejectedCount,

      leave_balances: [
        {
          allocated: parseFloat(balance.allocated),
          used: parseFloat(balance.used),
          balance: parseFloat(balance.balance),
          year: balance.year,
        },
      ],

      recent_leaves: recentLeaves.map((l) => ({
        id: l.id,
        leave_type: l.leaveType?.name,
        start_date: l.start_date,
        end_date: l.end_date,
        working_days: parseFloat(l.working_days),
        status: l.status,
      })),

      upcoming_holidays: upcomingHolidays.map((h) => ({
        id: h.id,
        holiday_name: h.holiday_name,
        holiday_date: h.holiday_date,
      })),
    };
  }

  /**
   * Manager Dashboard Metrics
   *
   * @param {Object} manager
   * @returns {Promise<Object>}
   */
  async manager(manager) {
    const todayStr = dayjs().format('YYYY-MM-DD');

    const directReports = await User.findAll({
      where: { manager_id: manager.id },
      attributes: ['id'],
    });

    const reportIds = directReports.map((r) => r.id);

    const pendingCount = await LeaveRequest.count({
      where: {
        employee_id: { [Op.in]: reportIds },
        status: 'pending',
      },
    });

    const approvedCount = await LeaveRequest.count({
      where: {
        employee_id: { [Op.in]: reportIds },
        status: 'approved',
      },
    });

    const rejectedCount = await LeaveRequest.count({
      where: {
        employee_id: { [Op.in]: reportIds },
        status: 'rejected',
      },
    });

    const pendingLeaves = await LeaveRequest.findAll({
      where: {
        employee_id: { [Op.in]: reportIds },
        status: 'pending',
      },
      include: [
        { model: User, as: 'employee' },
        { model: LeaveType, as: 'leaveType' },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    const teamOnLeaveToday = await LeaveRequest.findAll({
      where: {
        employee_id: { [Op.in]: reportIds },
        status: 'approved',
        start_date: { [Op.lte]: todayStr },
        end_date: { [Op.gte]: todayStr },
      },
      include: [
        { model: User, as: 'employee' },
        { model: LeaveType, as: 'leaveType' },
      ],
    });

    const upcomingLeaves = await LeaveRequest.findAll({
      where: {
        employee_id: { [Op.in]: reportIds },
        status: 'approved',
        start_date: { [Op.gt]: todayStr },
      },
      include: [
        { model: User, as: 'employee' },
        { model: LeaveType, as: 'leaveType' },
      ],
      order: [['start_date', 'ASC']],
      limit: 5,
    });

    return {
      team_size: reportIds.length,
      pending_approvals: pendingCount,
      team_leave_summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      team_on_leave_today: teamOnLeaveToday.map((l) => ({
        employee_name: `${l.employee?.first_name || ''} ${l.employee?.last_name || ''}`.trim(),
        leave_type: l.leaveType?.name || '',
        start_date: l.start_date,
        end_date: l.end_date,
      })),
      upcoming_leaves: upcomingLeaves.map((l) => ({
        employee_name: `${l.employee?.first_name || ''} ${l.employee?.last_name || ''}`.trim(),
        leave_type: l.leaveType?.name || '',
        start_date: l.start_date,
        end_date: l.end_date,
      })),
      pending_requests: pendingLeaves.map((l) => ({
        id: l.id,
        employee_name: `${l.employee?.first_name || ''} ${l.employee?.last_name || ''}`.trim(),
        leave_type: l.leaveType?.name,
        start_date: l.start_date,
        end_date: l.end_date,
        working_days: parseFloat(l.working_days),
      })),
    };
  }

  /**
   * HR Dashboard Metrics
   *
   * @returns {Promise<Object>}
   */
  async hr() {
    const currentYear = dayjs().year();
    const todayStr = dayjs().format('YYYY-MM-DD');

    const totalEmployees = await User.count();
    const activeEmployees = await User.count({ where: { status: 'active' } });

    const pendingCount = await LeaveRequest.count({ where: { status: 'pending' } });
    const approvedCount = await LeaveRequest.count({ where: { status: 'approved' } });
    const rejectedCount = await LeaveRequest.count({ where: { status: 'rejected' } });

    const onLeaveToday = await LeaveRequest.count({
      where: {
        status: 'approved',
        start_date: { [Op.lte]: todayStr },
        end_date: { [Op.gte]: todayStr },
      },
    });

    // Department-wise leave summary
    const [deptLeaveRows] = await sequelize.query(`
      SELECT u.department_id, SUM(lr.working_days) as total_days
      FROM users u
      JOIN leave_requests lr ON u.id = lr.employee_id
      WHERE u.deleted_at IS NULL
        AND lr.status = 'approved'
        AND YEAR(lr.start_date) = ${currentYear}
      GROUP BY u.department_id
    `);

    const deptLeaveTotals = {};
    for (const row of deptLeaveRows) {
      deptLeaveTotals[row.department_id] = parseFloat(row.total_days || 0);
    }

    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          required: false,
        },
      ],
    });

    const deptSummary = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code || null,
      employee_count: d.users ? d.users.length : 0,
      total_leaves_taken: deptLeaveTotals[d.id] || 0.0,
    }));

    const recentRequests = await LeaveRequest.findAll({
      include: [
        { model: User, as: 'employee' },
        { model: LeaveType, as: 'leaveType' },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    const upcomingHolidays = await Holiday.findAll({
      where: {
        holiday_date: {
          [Op.gte]: todayStr,
        },
      },
      order: [['holiday_date', 'ASC']],
      limit: 5,
    });

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      pending_requests: pendingCount,
      approved_requests: approvedCount,
      approved_this_year: approvedCount,
      rejected_requests: rejectedCount,
      on_leave_today: onLeaveToday,
      company_leave_summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      department_leave_summary: deptSummary,
      recent_requests: recentRequests.map((l) => ({
        id: l.id,
        employee_name: `${l.employee?.first_name || ''} ${l.employee?.last_name || ''}`.trim(),
        leave_type: l.leaveType?.name,
        start_date: l.start_date,
        end_date: l.end_date,
        working_days: parseFloat(l.working_days),
        status: l.status,
      })),
      upcoming_holidays: upcomingHolidays.map((h) => ({
        id: h.id,
        holiday_name: h.holiday_name,
        holiday_date: h.holiday_date,
      })),
    };
  }
}

export default new DashboardService();
