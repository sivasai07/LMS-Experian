import { DomainException } from '../utils/exceptions.js';

/**
 * Role middleware: checks if authenticated user's role is in the allowed list.
 *
 * @param {...string} allowedRoles
 */
export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated.',
        errors: {},
        code: 'UNAUTHENTICATED',
      });
    }

    const userRole = req.user.role?.name;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden.',
        errors: {},
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

export default roleMiddleware;
