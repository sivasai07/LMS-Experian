import { Op } from 'sequelize';
import dayjs from 'dayjs';
import sequelize from '../config/database.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Role from '../models/Role.js';
import workingDayService from './workingDayService.js';
import holidayService from './holidayService.js';
import leaveBalanceService from './leaveBalanceService.js';
import config from '../config/config.js';
import { DomainException } from '../utils/exceptions.js';

const WITH_DETAIL = [
  {
    model: User,
    as: 'employee',
    include: [{ model: Department, as: 'department' }],
  },
  { model: LeaveType, as: 'leaveType' },
  { model: User, as: 'processor' },
  { model: User, as: 'canceller' },
];

export class LeaveRequestService {
  /**
   * Employee: apply for leave.
   *
   * @param {Object} data
   * @param {Object} employee - Authenticated user model
   * @returns {Promise<LeaveRequest>}
   */
  async apply(data, employee) {
    const leaveType = await LeaveType.findByPk(data.leave_type_id);
    if (!leaveType) {
      throw DomainException.notFound('Leave type');
    }

    const startDate = dayjs(data.start_date).startOf('day');
    const endDate = dayjs(data.end_date).startOf('day');
    const isHalfDay = Boolean(data.is_half_day);
    const halfDayType = data.half_day_type || null;
    const hasExplicitRange =
      data.start_half_day !== undefined || data.end_half_day !== undefined;

    const startHalfDay = data.start_half_day || (isHalfDay ? halfDayType : null);
    const endHalfDay = data.end_half_day || (isHalfDay ? halfDayType : null);

    const hasHalfDay = isHalfDay || startHalfDay !== null || endHalfDay !== null;

    // Half-day validation
    if (hasHalfDay && !leaveType.half_day_allowed) {
      throw new DomainException(
        'This leave type does not allow half-day applications.',
        'HALF_DAY_NOT_ALLOWED',
        422
      );
    }
    if (isHalfDay && !hasExplicitRange && !startDate.isSame(endDate, 'day')) {
      throw new DomainException(
        'Half-day leave must have the same start and end date.',
        'HALF_DAY_DATE_MISMATCH',
        422
      );
    }

    // Calculate working days
    const year = startDate.year();
    const holidayDates = await holidayService.getHolidayDatesForYear(year);

    const workingDays = workingDayService.calculate(
      startDate,
      endDate,
      holidayDates,
      startHalfDay,
      endHalfDay
    );

    if (workingDays <= 0) {
      throw new DomainException(
        'The selected date range contains no working days.',
        'NO_WORKING_DAYS',
        422
      );
    }

    if (workingDays > 5) {
      throw new DomainException(
        'Maximum consecutive leave allowed is 5 working days. You cannot apply for more than 5 days of leave.',
        'MAX_LEAVE_EXCEEDED',
        422
      );
    }

    // Overlap check — pending or approved requests in same date range
    const sStr = startDate.format('YYYY-MM-DD');
    const eStr = endDate.format('YYYY-MM-DD');

    const overlappingRequests = await LeaveRequest.findAll({
      where: {
        employee_id: employee.id,
        status: {
          [Op.in]: ['pending', 'approved'],
        },
        start_date: {
          [Op.lte]: eStr,
        },
        end_date: {
          [Op.gte]: sStr,
        },
      },
    });

    for (const existing of overlappingRequests) {
      const existingStart = dayjs(existing.start_date).startOf('day');
      const existingEnd = dayjs(existing.end_date).startOf('day');

      const overlapStart = startDate.isAfter(existingStart)
        ? startDate
        : existingStart;
      const overlapEnd = endDate.isBefore(existingEnd) ? endDate : existingEnd;

      let date = overlapStart;
      while (date.isSameOrBefore(overlapEnd, 'day')) {
        let existingHalf = null;

        if (existingStart.isSame(existingEnd, 'day')) {
          existingHalf = existing.start_half_day || existing.half_day_type || null;
        } else if (date.isSame(existingStart, 'day')) {
          existingHalf = existing.start_half_day || null;
        } else if (date.isSame(existingEnd, 'day')) {
          existingHalf = existing.end_half_day || null;
        }

        let newHalf = null;

        if (startDate.isSame(endDate, 'day')) {
          newHalf = startHalfDay;
        } else if (date.isSame(startDate, 'day')) {
          newHalf = startHalfDay;
        } else if (date.isSame(endDate, 'day')) {
          newHalf = endHalfDay;
        }

        // Conflict rules:
        // Full day + anything = conflict
        // Same half + same date = conflict
        // Opposite halves = allowed
        if (existingHalf === null || newHalf === null) {
          throw new DomainException(
            'You already have a leave request overlapping these dates.',
            'OVERLAPPING_LEAVE',
            422
          );
        }

        if (existingHalf === newHalf) {
          throw new DomainException(
            'You already have a leave request overlapping these dates.',
            'OVERLAPPING_LEAVE',
            422
          );
        }

        date = date.add(1, 'day');
      }
    }

    return sequelize.transaction(async (t) => {
      const balance = await leaveBalanceService.getOrCreate(employee.id, year, null, t);

      // Deduct working days immediately upon applying
      await leaveBalanceService.deduct(
        balance,
        workingDays,
        config.leave.maxNegativeBalance,
        t
      );

      const leaveRequest = await LeaveRequest.create(
        {
          employee_id: employee.id,
          leave_type_id: leaveType.id,
          start_date: data.start_date,
          end_date: data.end_date,
          working_days: workingDays,
          is_half_day: hasHalfDay,
          half_day_type: startHalfDay || data.half_day_type || null,
          start_half_day: startHalfDay,
          end_half_day: endHalfDay,
          reason: data.reason,
          status: 'pending',
          is_active: true,
        },
        { transaction: t }
      );

      return LeaveRequest.findByPk(leaveRequest.id, {
        include: WITH_DETAIL,
        transaction: t,
      });
    });
  }

  /**
   * Get authenticated user's own leave history (paginated).
   *
   * @param {Object} employee
   * @param {Object} filters
   * @returns {Promise<{ rows: LeaveRequest[], count: number }>}
   */
  async myLeaves(employee, filters = {}) {
    const where = { employee_id: employee.id };

    if (filters.status) {
      where.status = filters.status;
    }

    const perPage = parseInt(filters.per_page || '10', 10);
    const page = parseInt(filters.page || '1', 10);
    const offset = (page - 1) * perPage;

    const { rows, count } = await LeaveRequest.findAndCountAll({
      where,
      include: WITH_DETAIL,
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    return {
      rows,
      count,
      currentPage: page,
      perPage,
      lastPage: Math.ceil(count / perPage) || 1,
    };
  }

  /**
   * Get a single leave request (with access check).
   *
   * @param {number} id
   * @param {Object} actor
   * @returns {Promise<LeaveRequest>}
   */
  async findById(id, actor) {
    const roleName = actor.role?.name || '';

    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: WITH_DETAIL,
    });

    if (!leaveRequest) {
      throw DomainException.notFound('Leave request');
    }

    // Employees can only see their own
    if (roleName === 'Employee' && leaveRequest.employee_id !== actor.id) {
      throw DomainException.forbidden();
    }

    // Managers can see their own + direct reports
    if (roleName === 'Manager') {
      const isOwn = leaveRequest.employee_id === actor.id;
      const isDirect = leaveRequest.employee?.manager_id === actor.id;
      if (!isOwn && !isDirect) {
        throw DomainException.forbidden();
      }
    }

    return leaveRequest;
  }

  /**
   * Cancel a leave request.
   *
   * @param {number} id
   * @param {string} reason
   * @param {Object} actor
   * @returns {Promise<LeaveRequest>}
   */
  async cancel(id, reason, actor) {
    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: WITH_DETAIL,
    });

    if (!leaveRequest) {
      throw DomainException.notFound('Leave request');
    }

    // Only the employee who owns it can cancel
    if (leaveRequest.employee_id !== actor.id) {
      throw DomainException.forbidden('You can only cancel your own leave requests.');
    }

    if (leaveRequest.status !== 'pending') {
      throw new DomainException(
        'Only pending leaves can be cancelled.',
        'INVALID_STATUS_TRANSITION',
        422
      );
    }

    return sequelize.transaction(async (t) => {
      const year = dayjs(leaveRequest.start_date).year();
      const balance = await leaveBalanceService.getOrCreate(
        leaveRequest.employee_id,
        year,
        null,
        t
      );

      // Restore deducted working days back to common leave balance upon cancellation
      await leaveBalanceService.restore(
        balance,
        parseFloat(leaveRequest.working_days),
        t
      );

      await leaveRequest.update(
        {
          status: 'cancelled',
          is_active: false,
          cancelled_by: actor.id,
          cancelled_at: new Date(),
          cancellation_reason: reason,
        },
        { transaction: t }
      );

      return LeaveRequest.findByPk(id, {
        include: WITH_DETAIL,
        transaction: t,
      });
    });
  }

  /**
   * Get pending leave requests (Manager sees team direct reports, HR sees all).
   *
   * @param {Object} actor
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async pendingLeaves(actor, filters = {}) {
    const roleName = actor.role?.name || '';
    const statusFilter = filters.status || 'pending';

    const where = {};
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Find direct report IDs for this actor
    const directReports = await User.findAll({
      where: { manager_id: actor.id },
      attributes: ['id'],
    });
    const reportIds = directReports.map((r) => r.id);

    if (['HR', 'Admin', 'Super Admin'].includes(roleName)) {
      // HR sees direct reports + employees with manager_id == null
      if (reportIds.length > 0) {
        where[Op.or] = [
          { employee_id: { [Op.in]: reportIds } },
          { '$employee.manager_id$': null },
        ];
      } else {
        where['$employee.manager_id$'] = null;
      }
    } else {
      where.employee_id = { [Op.in]: reportIds };
    }

    const employeeInclude = {
      model: User,
      as: 'employee',
      include: [{ model: Department, as: 'department' }],
    };

    if (filters.search) {
      const term = `%${filters.search}%`;
      employeeInclude.where = {
        [Op.or]: [
          { first_name: { [Op.like]: term } },
          { last_name: { [Op.like]: term } },
          { employee_number: { [Op.like]: term } },
        ],
      };
    }

    const perPage = parseInt(filters.per_page || '10', 10);
    const page = parseInt(filters.page || '1', 10);
    const offset = (page - 1) * perPage;

    const { rows, count } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        employeeInclude,
        { model: LeaveType, as: 'leaveType' },
        { model: User, as: 'processor' },
        { model: User, as: 'canceller' },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    return {
      rows,
      count,
      currentPage: page,
      perPage,
      lastPage: Math.ceil(count / perPage) || 1,
    };
  }

  /**
   * Get all leave requests with filters (HR only).
   *
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async allLeaves(filters = {}) {
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.leave_type_id) {
      where.leave_type_id = parseInt(filters.leave_type_id, 10);
    }

    if (filters.from_date) {
      where.start_date = { [Op.gte]: filters.from_date };
    }

    if (filters.to_date) {
      where.end_date = { [Op.lte]: filters.to_date };
    }

    const employeeWhere = {};
    if (filters.search) {
      const term = `%${filters.search}%`;
      employeeWhere[Op.or] = [
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } },
        { employee_number: { [Op.like]: term } },
      ];
    }

    if (filters.department_id) {
      employeeWhere.department_id = parseInt(filters.department_id, 10);
    }

    if (filters.manager_id) {
      employeeWhere.manager_id = parseInt(filters.manager_id, 10);
    }

    const employeeInclude = {
      model: User,
      as: 'employee',
      include: [
        { model: Department, as: 'department' },
        { model: Role, as: 'role' },
      ],
      where: Object.keys(employeeWhere).length > 0 ? employeeWhere : undefined,
    };

    const sort = filters.sort || 'created_at';
    const direction = String(filters.direction || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const allowedSorts = ['created_at', 'start_date', 'end_date', 'status', 'working_days'];
    const order = allowedSorts.includes(sort) ? [[sort, direction]] : [['created_at', 'DESC']];

    const perPage = parseInt(filters.per_page || '10', 10);
    const page = parseInt(filters.page || '1', 10);
    const offset = (page - 1) * perPage;

    const { rows, count } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        employeeInclude,
        { model: LeaveType, as: 'leaveType' },
        { model: User, as: 'processor' },
        { model: User, as: 'canceller' },
      ],
      order,
      limit: perPage,
      offset,
    });

    return {
      rows,
      count,
      currentPage: page,
      perPage,
      lastPage: Math.ceil(count / perPage) || 1,
    };
  }

  /**
   * Approve a pending leave request (Manager or HR).
   *
   * @param {number} id
   * @param {string|null} remarks
   * @param {Object} actor
   * @returns {Promise<LeaveRequest>}
   */
  async approve(id, remarks, actor) {
    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: WITH_DETAIL,
    });

    if (!leaveRequest) {
      throw DomainException.notFound('Leave request');
    }

    if (leaveRequest.status !== 'pending') {
      throw new DomainException(
        'Only pending leaves can be approved.',
        'INVALID_STATUS_TRANSITION',
        422
      );
    }

    const employeeManagerId = leaveRequest.employee?.manager_id;
    const actorIsHr = actor.role?.name === 'HR';

    if (!actorIsHr && (!employeeManagerId || employeeManagerId !== actor.id)) {
      throw DomainException.forbidden(
        'Only the assigned manager or HR can approve this leave request.'
      );
    }

    return sequelize.transaction(async (t) => {
      await leaveRequest.update(
        {
          status: 'approved',
          processed_by: actor.id,
          processed_at: new Date(),
          remarks: remarks || null,
        },
        { transaction: t }
      );

      return LeaveRequest.findByPk(id, {
        include: WITH_DETAIL,
        transaction: t,
      });
    });
  }

  /**
   * Reject a pending leave request (Manager or HR).
   *
   * @param {number} id
   * @param {string|null} remarks
   * @param {Object} actor
   * @returns {Promise<LeaveRequest>}
   */
  async reject(id, remarks, actor) {
    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: WITH_DETAIL,
    });

    if (!leaveRequest) {
      throw DomainException.notFound('Leave request');
    }

    if (leaveRequest.status !== 'pending') {
      throw new DomainException(
        'Only pending leaves can be rejected.',
        'INVALID_STATUS_TRANSITION',
        422
      );
    }

    const employeeManagerId = leaveRequest.employee?.manager_id;
    const actorIsHr = actor.role?.name === 'HR';

    if (!actorIsHr && (!employeeManagerId || employeeManagerId !== actor.id)) {
      throw DomainException.forbidden(
        'Only the assigned manager or HR can reject this leave request.'
      );
    }

    return sequelize.transaction(async (t) => {
      const year = dayjs(leaveRequest.start_date).year();
      const balance = await leaveBalanceService.getOrCreate(
        leaveRequest.employee_id,
        year,
        null,
        t
      );

      // Restore deducted working days back to common leave balance upon rejection
      await leaveBalanceService.restore(
        balance,
        parseFloat(leaveRequest.working_days),
        t
      );

      await leaveRequest.update(
        {
          status: 'rejected',
          is_active: false,
          processed_by: actor.id,
          processed_at: new Date(),
          remarks: remarks || null,
        },
        { transaction: t }
      );

      return LeaveRequest.findByPk(id, {
        include: WITH_DETAIL,
        transaction: t,
      });
    });
  }
}

export default new LeaveRequestService();
