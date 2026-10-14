/**
 * @file permissions.js
 * @description Role-Based Access Control (RBAC) Permission Utility Functions.
 * Provides helper predicates for evaluating user permissions (isHR, isManager, canApprove, isAdmin)
 * to guard UI actions and conditional navigation links.
 *
 * @module utils/permissions
 */

import { ROLES } from '../constants/roles';

/**
 * Check if a user object matches one of the specified allowed role names.
 * @param {Object|null} user - User object containing role details (`user.role.name`).
 * @param {string[]} roles - List of permitted role names.
 * @returns {boolean} True if user role is included in allowed roles.
 */
export function hasRole(user, roles) {
  if (!user) return false;
  return roles.includes(user.role?.name);
}

/** Check if user possesses HR role. */
export const isHR = (user) => hasRole(user, [ROLES.HR]);

/** Check if user possesses Manager role. */
export const isManager = (user) => hasRole(user, [ROLES.MANAGER]);

/** Check if user possesses Employee role. */
export const isEmployee = (user) => hasRole(user, [ROLES.EMPLOYEE]);

/** Check if user possesses leave request approval privileges (HR or Manager). */
export const canApprove = (user) => hasRole(user, [ROLES.HR, ROLES.MANAGER]);

/** Check if user possesses administrative master data access privileges (HR). */
export const isAdmin = (user) => hasRole(user, [ROLES.HR]);
