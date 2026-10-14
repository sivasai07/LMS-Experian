import Grade from '../models/Grade.js';
import GradeJobTitle from '../models/GradeJobTitle.js';
import { DomainException } from '../utils/exceptions.js';

export class GradeService {
  async all() {
    return Grade.findAll({
      order: [['code', 'ASC']],
    });
  }

  async findById(id) {
    const grade = await Grade.findByPk(id);
    if (!grade) {
      throw DomainException.notFound('Grade');
    }
    return grade;
  }

  async create(data) {
    return Grade.create(data);
  }

  async update(id, data) {
    const grade = await this.findById(id);
    await grade.update(data);
    return grade.reload();
  }

  async delete(id) {
    const grade = await this.findById(id);

    const mappingCount = await GradeJobTitle.count({
      where: { grade_id: id },
    });

    if (mappingCount > 0) {
      throw DomainException.cannotDelete('Grade');
    }

    await grade.destroy();
  }
}

export default new GradeService();
