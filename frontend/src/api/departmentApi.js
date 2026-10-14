/**
 * @file departmentApi.js
 * @description Department Master Data API Services.
 * Provides functions for querying, creating, updating, and deleting organizational departments.
 *
 * @module api/departmentApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';
import { buildQueryString } from '../utils/helpers';

/**
 * Fetch paginated or filtered list of departments.
 * @param {Object} [params] - Search and pagination filters ({ search, page, per_page }).
 * @returns {Promise<Object>} Department list or paginated payload.
 */
export const getDepartments = (params) => api.get(`${API.DEPARTMENTS.BASE}${buildQueryString(params)}`);

/**
 * Fetch single department record by ID.
 * @param {number|string} id - Department ID.
 * @returns {Promise<Object>} Department record payload.
 */
export const getDepartment = (id) => api.get(API.DEPARTMENTS.BY_ID(id));

/**
 * Create a new organizational department (HR Admin).
 * @param {Object} data - Department data payload ({ name, code, description }).
 * @returns {Promise<Object>} Created department payload.
 */
export const createDepartment = (data) => api.post(API.DEPARTMENTS.BASE, data);

/**
 * Update an existing department record (HR Admin).
 * @param {number|string} id - Department ID.
 * @param {Object} data - Updated department payload.
 * @returns {Promise<Object>} Updated department payload.
 */
export const updateDepartment = (id, data) => api.put(API.DEPARTMENTS.BY_ID(id), data);

/**
 * Delete a department record (HR Admin).
 * @param {number|string} id - Department ID.
 * @returns {Promise<Object>} API success response payload.
 */
export const deleteDepartment = (id) => api.delete(API.DEPARTMENTS.BY_ID(id));
