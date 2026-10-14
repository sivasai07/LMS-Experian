import { Op } from 'sequelize';
import departmentService from '../services/departmentService.js';
import Department from '../models/Department.js';
import { success } from '../utils/apiResponse.js';
import { transformDepartment } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class DepartmentController {
  async index(req, res, next) {
    try {
      const departments = await departmentService.all();
      return success(res, departments.map(transformDepartment));
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const department = await departmentService.findById(req.params.id);
      return success(res, transformDepartment(department));
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const { name, description } = req.body;
      const errors = {};

      if (!name) {
        errors.name = ['The name field is required.'];
      } else {
        const existing = await Department.findOne({ where: { name } });
        if (existing) {
          errors.name = ['The name has already been taken.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const department = await departmentService.create({ name, description });
      return success(
        res,
        transformDepartment(department),
        'Department created successfully.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, description } = req.body;
      const errors = {};

      if (!name) {
        errors.name = ['The name field is required.'];
      } else {
        const existing = await Department.findOne({
          where: {
            name,
            id: { [Op.ne]: id },
          },
        });
        if (existing) {
          errors.name = ['The name has already been taken.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const department = await departmentService.update(id, { name, description });
      return success(
        res,
        transformDepartment(department),
        'Department updated successfully.'
      );
    } catch (err) {
      next(err);
    }
  }

  async destroy(req, res, next) {
    try {
      await departmentService.delete(req.params.id);
      return success(res, null, 'Department deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new DepartmentController();
