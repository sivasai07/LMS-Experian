import { Op } from 'sequelize';
import jobTitleService from '../services/jobTitleService.js';
import JobTitle from '../models/JobTitle.js';
import { success } from '../utils/apiResponse.js';
import { transformJobTitle } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class JobTitleController {
  async index(req, res, next) {
    try {
      const titles = await jobTitleService.all();
      return success(res, titles.map(transformJobTitle));
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const jobTitle = await jobTitleService.findById(req.params.id);
      return success(res, transformJobTitle(jobTitle));
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const { title, description } = req.body;
      const errors = {};

      if (!title) {
        errors.title = ['The title field is required.'];
      } else {
        const existing = await JobTitle.findOne({ where: { title } });
        if (existing) {
          errors.title = ['The title has already been taken.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const jobTitle = await jobTitleService.create({ title, description });
      return success(res, transformJobTitle(jobTitle), 'Job title created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { title, description } = req.body;
      const errors = {};

      if (!title) {
        errors.title = ['The title field is required.'];
      } else {
        const existing = await JobTitle.findOne({
          where: {
            title,
            id: { [Op.ne]: id },
          },
        });
        if (existing) {
          errors.title = ['The title has already been taken.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const jobTitle = await jobTitleService.update(id, { title, description });
      return success(res, transformJobTitle(jobTitle), 'Job title updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async destroy(req, res, next) {
    try {
      await jobTitleService.delete(req.params.id);
      return success(res, null, 'Job title deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new JobTitleController();
