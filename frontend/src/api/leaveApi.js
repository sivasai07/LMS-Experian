/**
 * @file leaveApi.js
 * @description Leave Request, Leave Balance, and Leave Type Master Data API Services.
 * Enforces API contracts for submitting leave applications, filtering employee/team/all requests,
 * processing manager approvals & rejections, user cancellations, balance queries, and Leave Type CRUD.
 *
 * @module api/leaveApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';
import { buildQueryString } from '../utils/helpers';

// ─── Leave Requests ───────────────────────────────────────────────────────────

/**
 * Submit a new leave request application.
 * @param {Object} data - Application data ({ leave_type_id, start_date, end_date, is_half_day, half_day_type, reason }).
 * @returns {Promise<Object>} Created leave request details payload.
 */
export const applyLeave = (data) => api.post(API.LEAVE.APPLY, data);

/**
 * Fetch leave requests belonging to the authenticated employee.
 * @param {Object} [params] - Query filters ({ status, page, per_page }).
 * @returns {Promise<Object>} Paginated leave requests payload.
 */
export const getMyLeaves = (params) => api.get(`${API.LEAVE.MY}${buildQueryString(params)}`);

/**
 * Fetch pending leave requests assigned to the manager for review.
 * @param {Object} [params] - Query filters.
 * @returns {Promise<Object>} Paginated pending requests payload.
 */
export const getPendingLeaves = (params) => api.get(`${API.LEAVE.PENDING}${buildQueryString(params)}`);

/**
 * Fetch all company leave requests (HR view).
 * @param {Object} [params] - Filter parameters ({ status, search, page, per_page }).
 * @returns {Promise<Object>} Paginated leave requests list.
 */
export const getAllLeaves = (params) => api.get(`${API.LEAVE.ALL}${buildQueryString(params)}`);

/**
 * Fetch single leave request details by ID.
 * @param {number|string} id - Leave request ID.
 * @returns {Promise<Object>} Detailed leave request record.
 */
export const getLeave = (id) => api.get(API.LEAVE.BY_ID(id));

/**
 * Approve a pending leave request (Manager or HR).
 * @param {number|string} id - Leave request ID.
 * @param {Object} [data] - Approval remarks ({ remarks }).
 * @returns {Promise<Object>} Updated leave request payload.
 */
export const approveLeave = (id, data) => api.post(API.LEAVE.APPROVE(id), data);

/**
 * Reject a pending leave request (Manager or HR).
 * @param {number|string} id - Leave request ID.
 * @param {Object} [data] - Rejection remarks ({ remarks }).
 * @returns {Promise<Object>} Updated leave request payload.
 */
export const rejectLeave = (id, data) => api.post(API.LEAVE.REJECT(id), data);

/**
 * Cancel a pending leave request (Employee).
 * Restores deducted days back to the employee's common leave balance.
 * @param {number|string} id - Leave request ID.
 * @param {Object} [data] - Cancellation reason ({ reason }).
 * @returns {Promise<Object>} Updated leave request payload.
 */
export const cancelLeave = (id, data) => api.post(API.LEAVE.CANCEL(id), data);

// ─── Leave Balances ───────────────────────────────────────────────────────────

/**
 * Fetch current employee leave balance.
 * @returns {Promise<Object>} Balance payload ({ year, total_allocated, used, balance }).
 */
export const getMyBalances = () => api.get(API.BALANCE.MY);

/**
 * Fetch specific employee leave balance by User ID (HR / Manager view).
 * @param {number|string} id - User ID.
 * @returns {Promise<Object>} User balance payload.
 */
export const getUserBalances = (id) => api.get(API.BALANCE.BY_USER(id));

// ─── Leave Types Master Data ──────────────────────────────────────────────────

/**
 * Fetch all configured leave types.
 * @returns {Promise<Object>} Array or paginated list of leave types.
 */
export const getLeaveTypes = () => api.get(API.LEAVE_TYPES.BASE);

/**
 * Fetch single leave type record by ID.
 * @param {number|string} id - Leave type ID.
 * @returns {Promise<Object>} Leave type details.
 */
export const getLeaveType = (id) => api.get(API.LEAVE_TYPES.BY_ID(id));

/**
 * Create a new leave type definition (HR).
 * @param {Object} data - Leave type attributes ({ name, code, description, max_days_per_year, is_paid }).
 * @returns {Promise<Object>} Created record payload.
 */
export const createLeaveType = (data) => api.post(API.LEAVE_TYPES.BASE, data);

/**
 * Update an existing leave type definition (HR).
 * @param {number|string} id - Leave type ID.
 * @param {Object} data - Updated leave type attributes.
 * @returns {Promise<Object>} Updated record payload.
 */
export const updateLeaveType = (id, data) => api.put(API.LEAVE_TYPES.BY_ID(id), data);

/**
 * Delete a leave type record (HR).
 * @param {number|string} id - Leave type ID.
 * @returns {Promise<Object>} API success response.
 */
export const deleteLeaveType = (id) => api.delete(API.LEAVE_TYPES.BY_ID(id));
