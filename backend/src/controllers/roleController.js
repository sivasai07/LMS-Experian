import roleService from '../services/roleService.js';
import { success } from '../utils/apiResponse.js';

export class RoleController {
  async index(req, res, next) {
    try {
      const roles = await roleService.all();
      return success(
        res,
        roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
        }))
      );
    } catch (err) {
      next(err);
    }
  }
}

export default new RoleController();
