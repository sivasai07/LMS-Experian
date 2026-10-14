import gradeJobTitleService from '../services/gradeJobTitleService.js';
import { success } from '../utils/apiResponse.js';
import { transformGradeJobTitle } from '../utils/transformers.js';

export class GradeJobTitleController {
  async index(req, res, next) {
    try {
      const combinations = await gradeJobTitleService.getAll();
      return success(res, combinations.map(transformGradeJobTitle));
    } catch (err) {
      next(err);
    }
  }
}

export default new GradeJobTitleController();
