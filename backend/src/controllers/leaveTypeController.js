import { Op } from 'sequelize';
import leaveTypeService from '../services/leaveTypeService.js';
import LeaveType from '../models/LeaveType.js';
import { success } from '../utils/apiResponse.js';
import { transformLeaveType } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class LeaveTypeController {
  async index(req, res, next) {
    try {
      const types = await leaveTypeService.all();
      return success(res, types.map(transformLeaveType));
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const type = await leaveTypeService.findById(req.params.id);
      return success(res, transformLeaveType(type));
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const { name, annual_quota, negative_limit, half_day_allowed, description } = req.body;
      const errors = {};

      if (!name) {
        errors.name = ['The name field is required.'];
      } else {
        const existing = await LeaveType.findOne({ where: { name } });
        if (existing) {
          errors.name = ['The name has already been taken.'];
        }
      }

      if (annual_quota === undefined || annual_quota === null || annual_quota === '') {
        errors.annual_quota = ['The annual quota field is required.'];
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const leaveType = await leaveTypeService.create({
        name,
        annual_quota: parseFloat(annual_quota),
        negative_limit: negative_limit !== undefined ? parseFloat(negative_limit) : 5.0,
        half_day_allowed: half_day_allowed !== undefined ? Boolean(half_day_allowed) : true,
        description,
      });

      return success(res, transformLeaveType(leaveType), 'Leave type created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, annual_quota, negative_limit, half_day_allowed, description } = req.body;
      const errors = {};

      if (name) {
        const existing = await LeaveType.findOne({
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

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (annual_quota !== undefined) updateData.annual_quota = parseFloat(annual_quota);
      if (negative_limit !== undefined) updateData.negative_limit = parseFloat(negative_limit);
      if (half_day_allowed !== undefined) updateData.half_day_allowed = Boolean(half_day_allowed);
      if (description !== undefined) updateData.description = description;

      const leaveType = await leaveTypeService.update(id, updateData);
      return success(res, transformLeaveType(leaveType), 'Leave type updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async destroy(req, res, next) {
    try {
      await leaveTypeService.delete(req.params.id);
      return success(res, null, 'Leave type deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new LeaveTypeController();
