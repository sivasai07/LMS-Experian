import LeaveType from '../models/LeaveType.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { DomainException } from '../utils/exceptions.js';

export class LeaveTypeService {
  async all() {
    return LeaveType.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findById(id) {
    const leaveType = await LeaveType.findByPk(id);
    if (!leaveType) {
      throw DomainException.notFound('Leave type');
    }
    return leaveType;
  }

  async create(data) {
    return LeaveType.create(data);
  }

  async update(id, data) {
    const leaveType = await this.findById(id);
    await leaveType.update(data);
    return leaveType.reload();
  }

  async delete(id) {
    const leaveType = await this.findById(id);

    const count = await LeaveRequest.count({
      where: { leave_type_id: id },
    });

    if (count > 0) {
      throw DomainException.cannotDelete('Leave type');
    }

    await leaveType.destroy();
  }
}

export default new LeaveTypeService();
