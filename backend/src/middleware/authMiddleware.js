import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import { AuthException } from '../utils/exceptions.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw AuthException.unauthenticated();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AuthException.unauthenticated();
    }

    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (isBlacklisted) {
      throw AuthException.unauthenticated('Token has been revoked.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired.',
          errors: {},
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token invalid.',
        errors: {},
        code: 'TOKEN_INVALID',
      });
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      throw AuthException.unauthenticated();
    }

    if (user.status !== 'active') {
      throw AuthException.accountInactive();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

export default authMiddleware;
