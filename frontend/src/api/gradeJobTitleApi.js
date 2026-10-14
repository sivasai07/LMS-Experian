/**
 * @file gradeJobTitleApi.js
 * @description Grade & Job Title Mapping Master Data API Services.
 * Provides endpoints for fetching, creating, editing, and deleting valid organizational grade and job title associations.
 *
 * @module api/gradeJobTitleApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';

/**
 * Fetch all valid grade and job title mappings.
 * @returns {Promise<Object>} Grade and job title relationship collection.
 */
export const getGradeJobTitles = () => api.get(API.GRADE_JOB_TITLES.BASE);

/**
 * Create a new Grade-Job Title association mapping.
 * @param {Object} data Mapping data payload.
 */
export const createGradeJobTitle = (data) => api.post(API.GRADE_JOB_TITLES.BASE, data);

/**
 * Update an existing Grade-Job Title mapping.
 * @param {number|string} id Mapping ID.
 * @param {Object} data Updated mapping payload.
 */
export const updateGradeJobTitle = (id, data) => api.put(`${API.GRADE_JOB_TITLES.BASE}/${id}`, data);

/**
 * Delete a Grade-Job Title mapping.
 * @param {number|string} id Mapping ID.
 */
export const deleteGradeJobTitle = (id) => api.delete(`${API.GRADE_JOB_TITLES.BASE}/${id}`);
