/**
 * @file roles.js
 * @description Role-Based Access Control (RBAC) Role Constants.
 * Centralizes role identifiers matching backend User roles (Employee, Manager, HR)
 * and defines approver permission groupings for leave requests.
 *
 * @module constants/roles
 */

export const ROLES = {
  HR: 'HR',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

/** Roles authorized to review, approve, or reject leave requests. */
export const APPROVER_ROLES = [ROLES.HR, ROLES.MANAGER];
