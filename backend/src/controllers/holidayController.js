import { Op } from 'sequelize';
import holidayService from '../services/holidayService.js';
import Holiday from '../models/Holiday.js';
import { success } from '../utils/apiResponse.js';
import { transformHoliday } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class HolidayController {
  async index(req, res, next) {
    try {
      const holidays = await holidayService.all();
      return success(res, holidays.map(transformHoliday));
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const holiday = await holidayService.findById(req.params.id);
      return success(res, transformHoliday(holiday));
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const { holiday_name, holiday_date, description } = req.body;
      const errors = {};

      if (!holiday_name) errors.holiday_name = ['The holiday name field is required.'];
      if (!holiday_date) errors.holiday_date = ['The holiday date field is required.'];

      if (holiday_name && holiday_date) {
        const existing = await Holiday.findOne({
          where: {
            holiday_name,
            holiday_date,
          },
        });
        if (existing) {
          errors.holiday_name = ['A holiday with this name already exists on the given date.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const holiday = await holidayService.create({
        holiday_name,
        holiday_date,
        description,
      });

      return success(res, transformHoliday(holiday), 'Holiday created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { holiday_name, holiday_date, description } = req.body;
      const errors = {};

      if (!holiday_name) errors.holiday_name = ['The holiday name field is required.'];
      if (!holiday_date) errors.holiday_date = ['The holiday date field is required.'];

      if (holiday_name && holiday_date) {
        const existing = await Holiday.findOne({
          where: {
            holiday_name,
            holiday_date,
            id: { [Op.ne]: id },
          },
        });
        if (existing) {
          errors.holiday_name = ['A holiday with this name already exists on the given date.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const holiday = await holidayService.update(id, {
        holiday_name,
        holiday_date,
        description,
      });

      return success(res, transformHoliday(holiday), 'Holiday updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async destroy(req, res, next) {
    try {
      await holidayService.delete(req.params.id);
      return success(res, null, 'Holiday deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new HolidayController();
