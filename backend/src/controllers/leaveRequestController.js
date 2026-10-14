import dayjs from 'dayjs';
import leaveRequestService from '../services/leaveRequestService.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';
import {
  transformLeaveRequestDetail,
  transformLeaveRequestList,
} from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class LeaveRequestController {
  /**
   * Submit a new leave request.
   * POST /api/v1/leave-requests
   */
  async apply(req, res, next) {
    try {
      const {
        leave_type_id,
        start_date,
        end_date,
        is_half_day,
        half_day_type,
        start_half_day,
        end_half_day,
        reason,
      } = req.body;

      const errors = {};

      if (!leave_type_id) {
        errors.leave_type_id = ['The leave type field is required.'];
      }
      if (!start_date) {
        errors.start_date = ['The start date field is required.'];
      }
      if (!end_date) {
        errors.end_date = ['The end date field is required.'];
      }
      if (start_date && end_date && dayjs(end_date).isBefore(dayjs(start_date), 'day')) {
        errors.end_date = ['The end date must be a date after or equal to start date.'];
      }
      if (!reason || !String(reason).trim()) {
        errors.reason = ['The reason field is required.'];
      } else if (String(reason).length > 500) {
        errors.reason = ['The reason may not be greater than 500 characters.'];
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const leave = await leaveRequestService.apply(
        {
          leave_type_id: parseInt(leave_type_id, 10),
          start_date,
          end_date,
          is_half_day: Boolean(is_half_day),
          half_day_type: half_day_type || null,
          start_half_day: start_half_day || null,
          end_half_day: end_half_day || null,
          reason,
        },
        req.user
      );

      return success(
        res,
        transformLeaveRequestDetail(leave),
        'Leave applied successfully.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve authenticated user's leave request history.
   * GET /api/v1/leave-requests/my
   */
  async my(req, res, next) {
    try {
      const paginator = await leaveRequestService.myLeaves(req.user, req.query);
      return paginatedSuccess(
        res,
        paginator.rows.map(transformLeaveRequestList),
        paginator
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve a single leave request.
   * GET /api/v1/leave-requests/:id
   */
  async show(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const leave = await leaveRequestService.findById(id, req.user);
      return success(res, transformLeaveRequestDetail(leave));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel an existing leave request.
   * POST /api/v1/leave-requests/:id/cancel
   */
  async cancel(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { cancellation_reason } = req.body;

      if (!cancellation_reason || !String(cancellation_reason).trim()) {
        throw new ValidationException({
          cancellation_reason: ['The cancellation reason field is required.'],
        });
      }
      if (String(cancellation_reason).length > 500) {
        throw new ValidationException({
          cancellation_reason: ['The cancellation reason may not be greater than 500 characters.'],
        });
      }

      const leave = await leaveRequestService.cancel(id, cancellation_reason, req.user);
      return success(
        res,
        transformLeaveRequestDetail(leave),
        'Leave cancelled successfully.'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve pending leave requests for approval.
   * GET /api/v1/leave-requests/pending
   */
  async pending(req, res, next) {
    try {
      const paginator = await leaveRequestService.pendingLeaves(req.user, req.query);
      return paginatedSuccess(
        res,
        paginator.rows.map(transformLeaveRequestList),
        paginator
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve all leave requests (HR).
   * GET /api/v1/leave-requests
   */
  async index(req, res, next) {
    try {
      const paginator = await leaveRequestService.allLeaves(req.query);
      return paginatedSuccess(
        res,
        paginator.rows.map(transformLeaveRequestList),
        paginator
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Approve a leave request.
   * POST /api/v1/leave-requests/:id/approve
   */
  async approve(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const remarks = req.body.remarks || null;

      if (remarks && String(remarks).length > 500) {
        throw new ValidationException({
          remarks: ['The remarks may not be greater than 500 characters.'],
        });
      }

      const leave = await leaveRequestService.approve(id, remarks, req.user);
      return success(
        res,
        transformLeaveRequestDetail(leave),
        'Leave approved successfully.'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reject a leave request.
   * POST /api/v1/leave-requests/:id/reject
   */
  async reject(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const remarks = req.body.remarks || null;

      if (remarks && String(remarks).length > 500) {
        throw new ValidationException({
          remarks: ['The remarks may not be greater than 500 characters.'],
        });
      }

      const leave = await leaveRequestService.reject(id, remarks, req.user);
      return success(
        res,
        transformLeaveRequestDetail(leave),
        'Leave rejected successfully.'
      );
    } catch (err) {
      next(err);
    }
  }
}

export default new LeaveRequestController();
