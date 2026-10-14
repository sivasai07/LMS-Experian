/**
 * @file userHelpers.js
 * @description Domain Adapter & Transformer Utilities.
 * Harmonizes API response payloads (e.g., separated first/last names, enum objects, pagination metadata)
 * into predictable, standardized data structures consumed by frontend UI components.
 */

/**
 * Computes human-readable full name from user/employee model object.
 * Safely resolves nested employee objects, fallback `name` attributes, or split `first_name`/`last_name` pairs.
 *
 * @param {Object|null} user - User or employee domain object.
 * @returns {string} Formatted full name or fallback dash ('—').
 */
export function getFullName(user) {
  if (!user) return '—';
  if (user.first_name || user.last_name) {
    const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    if (full) return full;
  }
  if (user.name) return user.name;
  return '—';
}

/**
 * Extracts formatted employee display name from leave request relation object.
 * Supports both `leave.employee` and `leave.user` relational mappings.
 *
 * @param {Object|null} leave - Leave request object.
 * @returns {string} Formatted employee name or fallback dash ('—').
 */
export function getLeaveEmployeeName(leave) {
  if (!leave) return '—';
  const emp = leave.employee ?? leave.user;
  return getFullName(emp);
}

/**
 * Resolves normalized status string from backend enum objects or primitive string values.
 * Handles both plain strings ('approved') and backing enum objects ({ value: 'approved', label: 'Approved' }).
 *
 * @param {string|{value: string}|null} status - Raw status property from API.
 * @returns {string} Standardized lowercase status string.
 */
export function getStatusValue(status) {
  if (!status) return '';
  if (typeof status === 'string') return status;
  return status.value ?? '';
}

/**
 * Normalizes backend Laravel pagination metadata into component-friendly pagination properties.
 * Computes `from` and `to` record index bounds for pagination status text display (e.g. "Showing 1 to 10 of 42 entries").
 *
 * @param {Object|null} meta - Raw pagination metadata from Laravel JSON response.
 * @param {number} meta.current_page - Active page index (1-based).
 * @param {number} meta.per_page - Number of records per page.
 * @param {number} meta.total - Total aggregate matching record count.
 * @param {number} meta.last_page - Total calculated page count.
 * @returns {Object|null} Normalized pagination object containing { current_page, per_page, total, last_page, from, to }.
 */
export function normalizeMeta(meta) {
  if (!meta) return null;
  const { current_page, per_page, total, last_page } = meta;
  const from = total > 0 ? ((current_page - 1) * per_page) + 1 : 0;
  const to = Math.min(current_page * per_page, total);
  return { current_page, per_page, total, last_page, from, to };
}
