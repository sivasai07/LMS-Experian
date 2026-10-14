import dashboardService from '../services/dashboardService.js';
import { success } from '../utils/apiResponse.js';

export class DashboardController {
  /**
   * Retrieve employee dashboard data.
   * GET /api/v1/dashboard/employee
   */
  async employee(req, res, next) {
    try {
      const data = await dashboardService.employee(req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve manager dashboard data.
   * GET /api/v1/dashboard/manager
   */
  async manager(req, res, next) {
    try {
      const data = await dashboardService.manager(req.user);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve HR dashboard data.
   * GET /api/v1/dashboard/hr
   */
  async hr(req, res, next) {
    try {
      const data = await dashboardService.hr();
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export default new DashboardController();
