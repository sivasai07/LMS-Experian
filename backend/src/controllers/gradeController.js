import { Op } from 'sequelize';
import gradeService from '../services/gradeService.js';
import Grade from '../models/Grade.js';
import { success } from '../utils/apiResponse.js';
import { transformGrade } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class GradeController {
  async index(req, res, next) {
    try {
      const grades = await gradeService.all();
      return success(res, grades.map(transformGrade));
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const grade = await gradeService.findById(req.params.id);
      return success(res, transformGrade(grade));
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const { code, description } = req.body;
      const errors = {};

      if (!code) {
        errors.code = ['The code field is required.'];
      } else {
        const existing = await Grade.findOne({ where: { code } });
        if (existing) {
          errors.code = ['The code has already been taken.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const grade = await gradeService.create({ code, description });
      return success(res, transformGrade(grade), 'Grade created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { code, description } = req.body;
      const errors = {};

      if (!code) {
        errors.code = ['The code field is required.'];
      } else {
        const existing = await Grade.findOne({
          where: {
            code,
            id: { [Op.ne]: id },
          },
        });
        if (existing) {
          errors.code = ['The code has already been taken.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const grade = await gradeService.update(id, { code, description });
      return success(res, transformGrade(grade), 'Grade updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async destroy(req, res, next) {
    try {
      await gradeService.delete(req.params.id);
      return success(res, null, 'Grade deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new GradeController();
