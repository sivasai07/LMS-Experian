import authService from '../services/authService.js';
import { success } from '../utils/apiResponse.js';
import { transformAuthUser } from '../utils/transformers.js';
import { ValidationException } from '../utils/exceptions.js';

export class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const errors = {};

      if (!email) {
        errors.email = ['The email field is required.'];
      }
      if (!password) {
        errors.password = ['The password field is required.'];
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const payload = await authService.login({ email, password });

      return success(res, {
        token: payload.token,
        access_token: payload.token,
        token_type: payload.token_type,
        expires_in: payload.expires_in,
        force_password_change: payload.force_password_change,
        user: transformAuthUser(payload.user),
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.token);
      return success(res, null, 'Successfully logged out.');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const payload = await authService.refresh(req.token);
      return success(res, payload);
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.me(req.user);
      return success(res, transformAuthUser(user));
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { current_password, password, password_confirmation } = req.body;
      const errors = {};

      if (!current_password) {
        errors.current_password = ['The current password field is required.'];
      }
      if (!password) {
        errors.password = ['The password field is required.'];
      } else {
        if (password.length < 8) {
          errors.password = ['The password must be at least 8 characters.'];
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
          errors.password = [
            'The password must contain at least one uppercase letter, one lowercase letter, and one digit.',
          ];
        }
      }

      if (!password_confirmation) {
        errors.password_confirmation = ['The password confirmation field is required.'];
      } else if (password && password !== password_confirmation) {
        errors.password = ['The password confirmation does not match.'];
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationException(errors);
      }

      const payload = await authService.changePassword(
        req.user,
        current_password,
        password,
        req.token
      );

      return success(res, payload, 'Password changed successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
