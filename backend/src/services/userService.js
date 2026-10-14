import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Department from '../models/Department.js';
import GradeJobTitle from '../models/GradeJobTitle.js';
import Grade from '../models/Grade.js';
import JobTitle from '../models/JobTitle.js';
import LeaveBalance from '../models/LeaveBalance.js';
import leaveBalanceService from './leaveBalanceService.js';
import mailService from './mailService.js';
import { DomainException } from '../utils/exceptions.js';

const WITH_DETAIL = [
  { model: Role, as: 'role' },
  { model: Department, as: 'department' },
  {
    model: GradeJobTitle,
    as: 'gradeJobTitle',
    include: [
      { model: Grade, as: 'grade' },
      { model: JobTitle, as: 'jobTitle' },
    ],
  },
  {
    model: User,
    as: 'manager',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
  { model: LeaveBalance, as: 'leaveBalances' },
];

const WITH_LIST = [
  { model: Role, as: 'role' },
  { model: Department, as: 'department' },
  {
    model: GradeJobTitle,
    as: 'gradeJobTitle',
    include: [
      { model: Grade, as: 'grade' },
      { model: JobTitle, as: 'jobTitle' },
    ],
  },
  {
    model: User,
    as: 'manager',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
];

export class UserService {
  /**
   * HR: full user list with search / filter / sort / pagination
   *
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async paginate(filters = {}) {
    const includeTrashed =
      filters.with_trashed === true ||
      filters.with_trashed === 'true' ||
      filters.with_trashed === '1';

    const where = {};
    const roleWhere = {};

    if (filters.search) {
      const term = `%${filters.search}%`;
      where[Op.or] = [
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { employee_number: { [Op.like]: term } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.department_id) {
      where.department_id = parseInt(filters.department_id, 10);
    }

    if (filters.role_id) {
      where.role_id = parseInt(filters.role_id, 10);
    }

    if (filters.role) {
      roleWhere.name = filters.role;
    }

    if (filters.employment_type) {
      where.employment_type = filters.employment_type;
    }

    if (filters.grade_job_title_id) {
      where.grade_job_title_id = parseInt(filters.grade_job_title_id, 10);
    }

    if (filters.manager_id) {
      where.manager_id = parseInt(filters.manager_id, 10);
    }

    const sort = filters.sort || 'created_at';
    const direction =
      String(filters.direction || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const allowedSorts = [
      'first_name',
      'last_name',
      'email',
      'employee_number',
      'joining_date',
      'status',
      'created_at',
    ];
    const order = allowedSorts.includes(sort)
      ? [[sort, direction]]
      : [['created_at', 'DESC']];

    const perPage = parseInt(filters.per_page || '10', 10);
    const page = parseInt(filters.page || '1', 10);
    const offset = (page - 1) * perPage;

    const include = WITH_LIST.map((inc) => {
      if (inc.as === 'role' && Object.keys(roleWhere).length > 0) {
        return { ...inc, where: roleWhere };
      }
      return inc;
    });

    const { rows, count } = await User.findAndCountAll({
      where,
      include,
      order,
      limit: perPage,
      offset,
      paranoid: !includeTrashed,
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
   * Find a user with all detail relationships or throw 404.
   *
   * @param {number} id
   * @returns {Promise<User>}
   */
  async findById(id) {
    const user = await User.findByPk(id, {
      include: WITH_DETAIL,
    });

    if (!user) {
      throw DomainException.notFound('User');
    }

    return user;
  }

  /**
   * Create a user, hashing the password and optionally storing a photo.
   * Automatically initializes the employee's single common leave balance (20 days).
   * Dispatches Welcome Employee Email notification.
   *
   * @param {Object} data
   * @param {string|null} photoPath
   * @returns {Promise<User>}
   */
  async create(data, photoPath = null) {
    if (data.manager_id) {
      await this.validateManagerHierarchy(null, parseInt(data.manager_id, 10));
    }

    const rawPassword = data.password || 'Password@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    return sequelize.transaction(async (t) => {
      const payload = {
        ...data,
        password: hashedPassword,
        force_password_change:
          data.force_password_change !== undefined ? data.force_password_change : true,
      };

      if (photoPath) {
        payload.profile_photo = photoPath;
      }

      const user = await User.create(payload, { transaction: t });

      // Initialize common leave balance for current year
      await leaveBalanceService.getOrCreate(user.id, null, null, t);

      // Send welcome email (asynchronous / non-blocking)
      mailService.sendWelcomeEmail(user, rawPassword);

      return User.findByPk(user.id, {
        include: WITH_DETAIL,
        transaction: t,
      });
    });
  }

  /**
   * Update a user by ID.
   *
   * @param {number} id
   * @param {Object} data
   * @param {string|null} photoPath
   * @returns {Promise<User>}
   */
  async update(intId, data, photoPath = null) {
    const id = parseInt(intId, 10);
    if ('manager_id' in data) {
      await this.validateManagerHierarchy(
        id,
        data.manager_id ? parseInt(data.manager_id, 10) : null
      );
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw DomainException.notFound('User');
    }

    const updateData = { ...data };
    if (photoPath) {
      updateData.profile_photo = photoPath;
    }
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    await user.update(updateData);

    return User.findByPk(id, {
      include: WITH_DETAIL,
    });
  }

  /**
   * Validate that setting a proposed manager_id does not cause a circular reporting dependency.
   *
   * @param {number|null} userId ID of user being created or updated
   * @param {number|null} proposedManagerId Proposed manager user ID
   */
  async validateManagerHierarchy(userId, proposedManagerId) {
    if (!proposedManagerId) {
      return;
    }

    if (userId && parseInt(userId, 10) === parseInt(proposedManagerId, 10)) {
      throw new DomainException(
        'An employee cannot be assigned as their own manager.',
        'CIRCULAR_MANAGER_DEPENDENCY',
        422
      );
    }

    if (!userId) {
      return;
    }

    const visited = [parseInt(userId, 10)];
    let currentManagerId = parseInt(proposedManagerId, 10);

    while (currentManagerId !== null && currentManagerId > 0) {
      if (visited.includes(currentManagerId)) {
        throw new DomainException(
          'Circular management dependency detected. An employee cannot report to someone who directly or indirectly reports to them.',
          'CIRCULAR_MANAGER_DEPENDENCY',
          422
        );
      }
      visited.push(currentManagerId);

      const manager = await User.findByPk(currentManagerId, {
        attributes: ['id', 'manager_id'],
      });
      currentManagerId = manager?.manager_id ? parseInt(manager.manager_id, 10) : null;
    }
  }

  /**
   * Soft-delete a user by ID.
   * Also removes this user as manager from all reporting employees.
   *
   * @param {number} id
   * @param {Object} actor
   */
  async delete(id, actor) {
    if (actor.id === parseInt(id, 10)) {
      throw DomainException.forbidden('You cannot delete your own account.');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw DomainException.notFound('User');
    }

    await sequelize.transaction(async (t) => {
      // Remove deleted user as manager from reporting employees
      await User.update(
        { manager_id: null },
        {
          where: { manager_id: id },
          transaction: t,
        }
      );

      // Soft delete the user
      await user.destroy({ transaction: t });
    });
  }

  /**
   * Restore a soft deleted user.
   *
   * @param {number} id
   * @returns {Promise<User>}
   */
  async restore(id) {
    const user = await User.findByPk(id, { paranoid: false });
    if (!user) {
      throw DomainException.notFound('User');
    }

    await user.restore();

    return User.findByPk(id, {
      include: WITH_DETAIL,
    });
  }

  /**
   * Return the currently authenticated user with all detail relationships.
   *
   * @param {Object} actor
   * @returns {Promise<User>}
   */
  async profile(actor) {
    return this.findById(actor.id);
  }

  /**
   * Update personal profile fields for the authenticated user.
   *
   * @param {Object} actor
   * @param {Object} data
   * @param {string|null} photoPath
   * @returns {Promise<User>}
   */
  async updateProfile(actor, data, photoPath = null) {
    const allowed = [
      'first_name',
      'last_name',
      'personal_email',
      'phone',
      'gender',
      'dob',
      'blood_group',
      'address',
      'emergency_contact',
    ];

    const safe = {};
    for (const key of allowed) {
      if (key in data) {
        safe[key] = data[key];
      }
    }

    if (safe.gender && typeof safe.gender === 'string') {
      safe.gender = safe.gender.toLowerCase();
    }

    if (photoPath) {
      safe.profile_photo = photoPath;
    }

    const user = await User.findByPk(actor.id);
    await user.update(safe);

    return User.findByPk(actor.id, {
      include: WITH_DETAIL,
    });
  }

  /**
   * Paginated list of users who report directly to the authenticated manager.
   *
   * @param {Object} manager
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async directReports(manager, filters = {}) {
    const where = { manager_id: manager.id };

    if (filters.search) {
      const term = `%${filters.search}%`;
      where[Op.or] = [
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { employee_number: { [Op.like]: term } },
      ];
    }

    const perPage = parseInt(filters.per_page || '10', 10);
    const page = parseInt(filters.page || '1', 10);
    const offset = (page - 1) * perPage;

    const { rows, count } = await User.findAndCountAll({
      where,
      include: WITH_LIST,
      order: [['first_name', 'ASC']],
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
   * Paginated list of users whose role name is "Manager".
   *
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async managers(filters = {}) {
    return this.paginateByRole('Manager', filters);
  }

  /**
   * Paginated list of users whose role name is "Employee" or "Manager".
   *
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async employees(filters = {}) {
    const where = {};
    if (filters.search) {
      const term = `%${filters.search}%`;
      where[Op.or] = [
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { employee_number: { [Op.like]: term } },
      ];
    }

    const perPage = parseInt(filters.per_page || '10', 10);
    const page = parseInt(filters.page || '1', 10);
    const offset = (page - 1) * perPage;

    const { rows, count } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Role,
          as: 'role',
          where: { name: { [Op.in]: ['Employee', 'Manager'] } },
        },
        ...WITH_LIST.filter((i) => i.as !== 'role'),
      ],
      order: [['first_name', 'ASC']],
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
   * Paginate users filtered by role name.
   */
  async paginateByRole(roleName, filters = {}) {
    const where = {};
    if (filters.search) {
      const term = `%${filters.search}%`;
      where[Op.or] = [
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { employee_number: { [Op.like]: term } },
      ];
    }

    const perPage = parseInt(filters.per_page || '10', 10);
    const page = parseInt(filters.page || '1', 10);
    const offset = (page - 1) * perPage;

    const { rows, count } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Role,
          as: 'role',
          where: { name: roleName },
        },
        ...WITH_LIST.filter((i) => i.as !== 'role'),
      ],
      order: [['first_name', 'ASC']],
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
}

export default new UserService();
