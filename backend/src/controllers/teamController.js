import userService from '../services/userService.js';
import { paginatedSuccess } from '../utils/apiResponse.js';
import { transformUserList } from '../utils/transformers.js';

export class TeamController {
  async directReports(req, res, next) {
    try {
      const paginator = await userService.directReports(req.user, req.query);
      return paginatedSuccess(
        res,
        paginator.rows.map(transformUserList),
        paginator
      );
    } catch (err) {
      next(err);
    }
  }

  async managers(req, res, next) {
    try {
      const paginator = await userService.managers(req.query);
      return paginatedSuccess(
        res,
        paginator.rows.map(transformUserList),
        paginator
      );
    } catch (err) {
      next(err);
    }
  }

  async employees(req, res, next) {
    try {
      const paginator = await userService.employees(req.query);
      return paginatedSuccess(
        res,
        paginator.rows.map(transformUserList),
        paginator
      );
    } catch (err) {
      next(err);
    }
  }
}

export default new TeamController();
