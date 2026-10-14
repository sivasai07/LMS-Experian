import Role from '../models/Role.js';

export class RoleService {
  async all() {
    return Role.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description'],
    });
  }
}

export default new RoleService();
