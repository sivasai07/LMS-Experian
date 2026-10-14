import userService from '../services/userService.js';
import { success } from '../utils/apiResponse.js';
import { transformUserDetail } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class ProfileController {
  async show(req, res, next) {
    try {
      const user = await userService.profile(req.user);
      return success(res, transformUserDetail(user));
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { phone } = req.body;
      if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
        throw new ValidationException({
          phone: ['The phone format is invalid.'],
        });
      }

      const user = await userService.updateProfile(
        req.user,
        req.body,
        req.profilePhotoPath || null
      );

      return success(res, transformUserDetail(user), 'Profile updated successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new ProfileController();
