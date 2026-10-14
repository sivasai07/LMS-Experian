/**
 * @file holidayApi.js
 * @description Company Public Holiday Calendar Master Data API Services.
 * Enforces API contracts for querying upcoming holidays, creating annual holiday calendars,
 * and editing/deleting company holiday records (HR Admin).
 *
 * @module api/holidayApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';
import { buildQueryString } from '../utils/helpers';

/**
 * Fetch company public holidays calendar with optional year/date filters.
 * @param {Object} [params] - Query filters ({ year, search, page, per_page }).
 * @returns {Promise<Object>} List or paginated holidays payload.
 */
export const getHolidays = (params) => api.get(`${API.HOLIDAYS.BASE}${buildQueryString(params)}`);

/**
 * Fetch single holiday record by ID.
 * @param {number|string} id - Holiday ID.
 * @returns {Promise<Object>} Holiday record payload.
 */
export const getHoliday = (id) => api.get(API.HOLIDAYS.BY_ID(id));

/**
 * Add a new holiday to the company holiday calendar (HR Admin).
 * @param {Object} data - Holiday data payload ({ holiday_name, holiday_date, description }).
 * @returns {Promise<Object>} Created holiday record payload.
 */
export const createHoliday = (data) => api.post(API.HOLIDAYS.BASE, data);

/**
 * Update an existing holiday calendar record (HR Admin).
 * @param {number|string} id - Holiday ID.
 * @param {Object} data - Updated holiday fields.
 * @returns {Promise<Object>} Updated holiday record payload.
 */
export const updateHoliday = (id, data) => api.put(API.HOLIDAYS.BY_ID(id), data);

/**
 * Delete a holiday record from the company calendar (HR Admin).
 * @param {number|string} id - Holiday ID.
 * @returns {Promise<Object>} API success response payload.
 */
export const deleteHoliday = (id) => api.delete(API.HOLIDAYS.BY_ID(id));
