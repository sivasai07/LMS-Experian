import { AuthException, DomainException, ValidationException } from '../utils/exceptions.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AuthException) {
    const errors = err.httpStatus === 422 ? { current_password: [err.message] } : {};
    return res.status(err.httpStatus).json({
      success: false,
      message: err.message,
      errors,
      code: err.errorCode,
    });
  }

  if (err instanceof DomainException) {
    return res.status(err.httpStatus).json({
      success: false,
      message: err.message,
      errors: {},
      code: err.errorCode,
    });
  }

  if (err instanceof ValidationException) {
    return res.status(err.httpStatus).json({
      success: false,
      message: err.message,
      errors: err.errors || {},
      code: err.errorCode,
    });
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = {};
    err.errors?.forEach((e) => {
      errors[e.path] = [e.message || `${e.path} already exists.`];
    });

    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors,
      code: 'VALIDATION_ERROR',
    });
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const errors = {};
    err.errors?.forEach((e) => {
      errors[e.path] = [e.message];
    });

    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors,
      code: 'VALIDATION_ERROR',
    });
  }

  // Default unhandled error
  console.error('Unhandled error:', err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error.',
    errors: {},
    code: err.code || 'SERVER_ERROR',
  });
};

export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'The requested endpoint does not exist.',
    errors: {},
    code: 'NOT_FOUND',
  });
};

export default errorHandler;
