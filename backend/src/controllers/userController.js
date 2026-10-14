import { Op } from 'sequelize';
import userService from '../services/userService.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Department from '../models/Department.js';
import GradeJobTitle from '../models/GradeJobTitle.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';
import { transformUserDetail, transformUserList } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class UserController {
  async index(req, res, next) {
    try {
      const paginator = await userService.paginate(req.query);
      return paginatedSuccess(
        res,
        paginator.rows.map(transformUserList),
        paginator
      );
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const user = await userService.findById(req.params.id);
      return success(res, transformUserDetail(user));
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const {
        employee_number,
        first_name,
        last_name,
        email,
        password,
        joining_date,
        role_id,
        department_id,
        grade_job_title_id,
        manager_id,
      } = req.body;

      const errors = {};

      if (!employee_number) errors.employee_number = ['The employee number field is required.'];
      if (!first_name) errors.first_name = ['The first name field is required.'];
      if (!last_name) errors.last_name = ['The last name field is required.'];
      if (!email) errors.email = ['The email field is required.'];
      if (!password) {
        errors.password = ['The password field is required.'];
      } else if (password.length < 8) {
        errors.password = ['The password must be at least 8 characters.'];
      }
      if (!joining_date) errors.joining_date = ['The joining date field is required.'];
      if (!role_id) errors.role_id = ['The role id field is required.'];
      if (!department_id) errors.department_id = ['The department id field is required.'];
      if (!grade_job_title_id) errors.grade_job_title_id = ['The grade job title id field is required.'];

      if (email) {
        const existingEmail = await User.findOne({ where: { email }, paranoid: false });
        if (existingEmail) {
          errors.email = ['The email has already been taken.'];
        }
      }

      if (employee_number) {
        const existingEmpNo = await User.findOne({ where: { employee_number }, paranoid: false });
        if (existingEmpNo) {
          errors.employee_number = ['The employee number has already been taken.'];
        }
      }

      if (role_id) {
        const role = await Role.findByPk(role_id);
        if (!role) errors.role_id = ['The selected role id is invalid.'];
      }

      if (department_id) {
        const dept = await Department.findByPk(department_id);
        if (!dept) errors.department_id = ['The selected department id is invalid.'];
      }

      if (grade_job_title_id) {
        const gjt = await GradeJobTitle.findByPk(grade_job_title_id);
        if (!gjt) errors.grade_job_title_id = ['The selected grade job title id is invalid.'];
      }

      if (manager_id) {
        const mgr = await User.findByPk(manager_id);
        if (!mgr) errors.manager_id = ['The selected manager id is invalid.'];
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const user = await userService.create(req.body, req.profilePhotoPath || null);

      return success(res, transformUserDetail(user), 'User created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const errors = {};

      if (req.body.email) {
        const existingEmail = await User.findOne({
          where: {
            email: req.body.email,
            id: { [Op.ne]: id },
          },
          paranoid: false,
        });
        if (existingEmail) {
          errors.email = ['The email has already been taken.'];
        }
      }

      if (req.body.employee_number) {
        const existingEmpNo = await User.findOne({
          where: {
            employee_number: req.body.employee_number,
            id: { [Op.ne]: id },
          },
          paranoid: false,
        });
        if (existingEmpNo) {
          errors.employee_number = ['The employee number has already been taken.'];
        }
      }

      if (req.body.role_id) {
        const role = await Role.findByPk(req.body.role_id);
        if (!role) errors.role_id = ['The selected role id is invalid.'];
      }

      if (req.body.department_id) {
        const dept = await Department.findByPk(req.body.department_id);
        if (!dept) errors.department_id = ['The selected department id is invalid.'];
      }

      if (req.body.grade_job_title_id) {
        const gjt = await GradeJobTitle.findByPk(req.body.grade_job_title_id);
        if (!gjt) errors.grade_job_title_id = ['The selected grade job title id is invalid.'];
      }

      if (req.body.manager_id) {
        const mgr = await User.findByPk(req.body.manager_id);
        if (!mgr) errors.manager_id = ['The selected manager id is invalid.'];
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const user = await userService.update(id, req.body, req.profilePhotoPath || null);

      return success(res, transformUserDetail(user), 'User updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async destroy(req, res, next) {
    try {
      await userService.delete(req.params.id, req.user);
      return success(res, null, 'User deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  async restore(req, res, next) {
    try {
      const user = await userService.restore(req.params.id);
      return success(res, transformUserDetail(user), 'User restored successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
