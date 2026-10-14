import GradeJobTitle from '../models/GradeJobTitle.js';
import Grade from '../models/Grade.js';
import JobTitle from '../models/JobTitle.js';

export class GradeJobTitleService {
  async getAll() {
    return GradeJobTitle.findAll({
      include: [
        { model: Grade, as: 'grade' },
        { model: JobTitle, as: 'jobTitle' },
      ],
      order: [
        [{ model: Grade, as: 'grade' }, 'code', 'ASC'],
        [{ model: JobTitle, as: 'jobTitle' }, 'title', 'ASC'],
      ],
    });
  }
}

export default new GradeJobTitleService();
