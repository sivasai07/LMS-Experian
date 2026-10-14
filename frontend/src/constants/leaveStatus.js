/**
 * @file leaveStatus.js
 * @description Leave Request Lifecycle Status Constants & Badge Color Mappings.
 * Maps status strings (Pending, Approved, Rejected, Cancelled) to UI design system badge variants
 * and provides safe case-insensitive variant lookup helper.
 *
 * @module constants/leaveStatus
 */

export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

/** UI Badge variant mapping per leave request lifecycle state. */
export const LEAVE_STATUS_COLORS = {
  [LEAVE_STATUS.PENDING]: 'warning',
  [LEAVE_STATUS.APPROVED]: 'success',
  [LEAVE_STATUS.REJECTED]: 'danger',
  [LEAVE_STATUS.CANCELLED]: 'danger',
  pending: 'warning',
  Pending: 'warning',
  approved: 'success',
  Approved: 'success',
  rejected: 'danger',
  Rejected: 'danger',
  cancelled: 'danger',
  Cancelled: 'danger',
  canceled: 'danger',
  Canceled: 'danger',
};

/**
 * Safely resolves the badge variant theme for any raw status string or enum object.
 * @param {string|Object} status - Raw status value.
 * @returns {string} UI Badge variant ('warning', 'success', 'danger', or 'default').
 */
export function getLeaveStatusVariant(status) {
  if (!status) return 'default';
  const val = typeof status === 'object' ? status.value : status;
  return LEAVE_STATUS_COLORS[val] ?? LEAVE_STATUS_COLORS[String(val).toLowerCase()] ?? 'default';
}
