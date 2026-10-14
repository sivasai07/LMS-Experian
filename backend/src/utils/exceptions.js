export class DomainException extends Error {
  constructor(message, errorCode = 'DOMAIN_ERROR', httpStatus = 400) {
    super(message);
    this.name = 'DomainException';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }

  static forbidden(message = 'Forbidden.') {
    return new DomainException(message, 'FORBIDDEN', 403);
  }

  static notFound(entity = 'Resource') {
    return new DomainException(
      `${entity} not found.`,
      `${entity.replace(/\s+/g, '_').toUpperCase()}_NOT_FOUND`,
      404
    );
  }

  static cannotDelete(entity = 'Resource') {
    return new DomainException(
      `Cannot delete ${entity.toLowerCase()} because it is referenced by other records.`,
      `CANNOT_DELETE_${entity.replace(/\s+/g, '_').toUpperCase()}`,
      422
    );
  }
}

export class AuthException extends Error {
  constructor(message, errorCode = 'AUTH_ERROR', httpStatus = 401) {
    super(message);
    this.name = 'AuthException';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }

  static invalidCredentials(message = 'Invalid credentials.') {
    return new AuthException(message, 'INVALID_CREDENTIALS', 401);
  }

  static accountInactive(message = 'Your account is inactive. Please contact HR.') {
    return new AuthException(message, 'ACCOUNT_INACTIVE', 403);
  }

  static unauthenticated(message = 'Unauthenticated.') {
    return new AuthException(message, 'UNAUTHENTICATED', 401);
  }

  static incorrectCurrentPassword(message = 'The current password provided is incorrect.') {
    return new AuthException(message, 'INVALID_CURRENT_PASSWORD', 422);
  }
}

export class ValidationException extends Error {
  constructor(errors, message = 'Validation failed.') {
    super(message);
    this.name = 'ValidationException';
    this.errorCode = 'VALIDATION_ERROR';
    this.httpStatus = 422;
    this.errors = errors;
  }
}
