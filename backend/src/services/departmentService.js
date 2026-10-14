import Department from '../models/Department.js';
import User from '../models/User.js';
import { DomainException } from '../utils/exceptions.js';

export class DepartmentService {
  async all() {
    return Department.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findById(id) {
    const department = await Department.findByPk(id);
    if (!department) {
      throw DomainException.notFound('Department');
    }
    return department;
  }

  async create(data) {
    return Department.create(data);
  }

  async update(id, data) {
    const department = await this.findById(id);
    await department.update(data);
    return department.reload();
  }

  async delete(id) {
    const department = await this.findById(id);

    const userCount = await User.count({
      where: { department_id: id },
    });

    if (userCount > 0) {
      throw DomainException.cannotDelete('Department');
    }

    await department.destroy();
  }
}

export default new DepartmentService();
