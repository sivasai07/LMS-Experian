/**
 * @file validators.js
 * @description Frontend Form Validation & Field Assertion Utilities.
 * Provides functions for validating required fields, minimum string length, email syntax,
 * password matching, and comprehensive leave request application form assertions.
 *
 * @module utils/validators
 */

/**
 * Assert that a field value is non-empty and non-whitespace.
 * @param {any} value - Field value.
 * @param {string} [fieldName='This field'] - Field label for error message construction.
 * @returns {string|null} Error string if validation fails, or null if valid.
 */
export function required(value, fieldName = 'This field') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required.`;
  }
  return null;
}

/**
 * Assert that a string meets minimum character length requirements.
 * @param {string} value - Field string.
 * @param {number} min - Minimum character threshold.
 * @param {string} [fieldName='This field'] - Field label for error message.
 * @returns {string|null} Error string if validation fails, or null if valid.
 */
export function minLength(value, min, fieldName = 'This field') {
  if (value && value.length < min) {
    return `${fieldName} must be at least ${min} characters.`;
  }
  return null;
}

/**
 * Assert that a string conforms to valid RFC email address regex syntax.
 * @param {string} value - Email input string.
 * @returns {string|null} Error string if validation fails, or null if valid.
 */
export function isEmail(value) {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) return 'Please enter a valid email address.';
  return null;
}

/**
 * Assert that a password confirmation string matches the original new password.
 * @param {string} password - New password.
 * @param {string} confirmPassword - Password confirmation string.
 * @returns {string|null} Error string if passwords differ, or null if matching.
 */
export function passwordMatch(password, confirmPassword) {
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
}

/**
 * Validate an apply-leave form payload prior to API submission.
 * Checks leave type selection, start date, end date, date range order, and non-empty reason.
 *
 * @param {Object} form - Form data object ({ leave_type_id, start_date, end_date, reason }).
 * @returns {Record<string, string>} Key-value map of field validation error messages.
 */
export function validateLeaveForm(form) {
  const errors = {};
  if (!form.leave_type_id) errors.leave_type_id = 'Leave type is required.';
  if (!form.start_date) errors.start_date = 'Start date is required.';
  if (!form.end_date) errors.end_date = 'End date is required.';
  if (form.start_date && form.end_date && form.start_date > form.end_date) {
    errors.end_date = 'End date must be on or after start date.';
  }
  if (!form.reason || !form.reason.trim()) errors.reason = 'Reason is required.';
  return errors;
}
