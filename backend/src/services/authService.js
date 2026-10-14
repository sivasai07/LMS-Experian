import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Role from '../models/Role.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import config from '../config/config.js';
import { AuthException } from '../utils/exceptions.js';

export class AuthService {
  /**
   * Authenticate user credentials and generate a JWT token.
   *
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>}
   */
  async login(credentials) {
    const user = await User.findOne({
      where: { email: credentials.email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
      throw AuthException.invalidCredentials();
    }

    if (user.status !== 'active') {
      throw AuthException.accountInactive();
    }

    const token = this.generateToken(user);

    return {
      token,
      token_type: 'bearer',
      expires_in: this.ttlInSeconds(),
      force_password_change: Boolean(user.force_password_change),
      user,
    };
  }

  /**
   * Logout the current authenticated user and invalidate their token.
   *
   * @param {string} token
   */
  async logout(token) {
    if (!token) {
      throw AuthException.unauthenticated();
    }

    try {
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
      await BlacklistedToken.create({
        token,
        expires_at: expiresAt,
      });
    } catch {
      throw AuthException.unauthenticated();
    }
  }

  /**
   * Refresh the current JWT token.
   *
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async refresh(token) {
    if (!token) {
      throw AuthException.unauthenticated();
    }

    const isBlacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (isBlacklisted) {
      throw AuthException.unauthenticated();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret, { ignoreExpiration: false });
      const user = await User.findByPk(decoded.id, {
        include: [{ model: Role, as: 'role' }],
      });

      if (!user || user.status !== 'active') {
        throw AuthException.unauthenticated();
      }

      // Invalidate the old token
      await this.logout(token);

      const newToken = this.generateToken(user);

      return {
        token: newToken,
        token_type: 'bearer',
        expires_in: this.ttlInSeconds(),
      };
    } catch {
      throw AuthException.unauthenticated();
    }
  }

  /**
   * Get the currently authenticated user.
   *
   * @param {Object} actor
   * @returns {Promise<User>}
   */
  async me(actor) {
    if (!actor) {
      throw AuthException.unauthenticated();
    }

    const user = await User.findByPk(actor.id, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      throw AuthException.unauthenticated();
    }

    return user;
  }

  /**
   * Change the current user's password.
   *
   * @param {Object} actor
   * @param {string} currentPassword
   * @param {string} newPassword
   * @param {string|null} oldToken
   * @returns {Promise<Object>}
   */
  async changePassword(actor, currentPassword, newPassword, oldToken = null) {
    const user = await User.findByPk(actor.id);
    if (!user) {
      throw AuthException.unauthenticated();
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw AuthException.incorrectCurrentPassword();
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      force_password_change: false,
    });

    if (oldToken) {
      try {
        await this.logout(oldToken);
      } catch {
        // Ignore already invalid token
      }
    }

    const refreshedUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
    });
    const newToken = this.generateToken(refreshedUser);

    return {
      token: newToken,
      token_type: 'bearer',
      expires_in: this.ttlInSeconds(),
    };
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role?.name || '',
        jti: Math.random().toString(36).substring(2) + Date.now().toString(36),
      },
      config.jwtSecret,
      { expiresIn: `${config.jwtTtlMinutes}m` }
    );
  }

  ttlInSeconds() {
    return config.jwtTtlMinutes * 60;
  }
}

export default new AuthService();
