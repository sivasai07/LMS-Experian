import leaveBalanceService from '../services/leaveBalanceService.js';
import { success } from '../utils/apiResponse.js';
import { transformLeaveBalance } from '../utils/transformers.js';

export class LeaveBalanceController {
  /**
   * Retrieve the authenticated user's leave balance.
   * GET /api/v1/leave-balances/my
   */
  async my(req, res, next) {
    try {
      const year = req.query.year ? parseInt(req.query.year, 10) : null;
      const balance = await leaveBalanceService.balancesForUser(req.user.id, year);

      return success(res, transformLeaveBalance(balance));
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Retrieve leave balance for a specific user.
   * GET /api/v1/leave-balances/:id
   */
  async forUser(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const year = req.query.year ? parseInt(req.query.year, 10) : null;
      const balance = await leaveBalanceService.balancesForUser(id, year);

      return success(res, transformLeaveBalance(balance));
    } catch (err) {
      return next(err);
    }
  }
}

export default new LeaveBalanceController();
