import JobTitle from '../models/JobTitle.js';
import GradeJobTitle from '../models/GradeJobTitle.js';
import { DomainException } from '../utils/exceptions.js';

export class JobTitleService {
  async all() {
    return JobTitle.findAll({
      order: [['title', 'ASC']],
    });
  }

  async findById(id) {
    const jobTitle = await JobTitle.findByPk(id);
    if (!jobTitle) {
      throw DomainException.notFound('Job title');
    }
    return jobTitle;
  }

  async create(data) {
    return JobTitle.create(data);
  }

  async update(id, data) {
    const jobTitle = await this.findById(id);
    await jobTitle.update(data);
    return jobTitle.reload();
  }

  async delete(id) {
    const jobTitle = await this.findById(id);

    const mappingCount = await GradeJobTitle.count({
      where: { job_title_id: id },
    });

    if (mappingCount > 0) {
      throw DomainException.cannotDelete('Job title');
    }

    await jobTitle.destroy();
  }
}

export default new JobTitleService();
