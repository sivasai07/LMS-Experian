/**
 * @file userApi.js
 * @description User and Employee Management API Services.
 * Provides functions for querying employees, creating/updating user accounts (HR), soft-deleting/restoring employees,
 * updating self-profile details, and fetching manager team direct reports.
 *
 * @module api/userApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';
import { buildQueryString } from '../utils/helpers';

/**
 * Fetch paginated list of employee users (HR View).
 * @param {Object} [params] - Search and pagination filters ({ search, department_id, role_id, page, per_page, show_deleted }).
 * @returns {Promise<Object>} Paginated users payload.
 */
export const getUsers = (params) => api.get(`${API.USERS.BASE}${buildQueryString(params)}`);

/**
 * Fetch single user profile record by ID.
 * @param {number|string} id - User ID.
 * @returns {Promise<Object>} User details object.
 */
export const getUser = (id) => api.get(API.USERS.BY_ID(id));

/**
 * Create a new employee user account (HR).
 * @param {Object} data - Employee form data payload.
 * @returns {Promise<Object>} Created user record.
 */
export const createUser = (data) => api.post(API.USERS.BASE, data);

/**
 * Update an existing employee user record (HR).
 * @param {number|string} id - User ID.
 * @param {Object} data - Updated employee fields.
 * @returns {Promise<Object>} Updated user record payload.
 */
export const updateUser = (id, data) => api.put(API.USERS.BY_ID(id), data);

/**
 * Soft-delete / deactivate an employee account (HR).
 * @param {number|string} id - User ID.
 * @returns {Promise<Object>} API success response.
 */
export const deleteUser = (id) => api.delete(API.USERS.BY_ID(id));

/**
 * Restore a soft-deleted employee account (HR).
 * @param {number|string} id - User ID.
 * @returns {Promise<Object>} Restored user payload.
 */
export const restoreUser = (id) => api.post(API.USERS.RESTORE(id));

/**
 * Fetch authenticated employee self profile.
 * @returns {Promise<Object>} Authenticated user profile data.
 */
export const getProfile = () => api.get(API.USERS.PROFILE);

/**
 * Update authenticated employee self profile attributes.
 * @param {Object} data - Updated profile fields (first_name, last_name, phone_number, address, emergency_contact).
 * @returns {Promise<Object>} Updated profile payload.
 */
export const updateProfile = (data) => api.put(API.USERS.PROFILE, data);

/**
 * Fetch manager's direct reports (Team View).
 * @param {Object} [params] - Query filters.
 * @returns {Promise<Object>} Team members list payload.
 */
export const getTeam = (params) => api.get(`${API.USERS.TEAM}${buildQueryString(params)}`);
