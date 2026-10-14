/**
 * @file authApi.js
 * @description Authentication API Services.
 * Provides functions for user login, logout, active user session verification (/me),
 * full employee profile retrieval, and mandatory/voluntary password change endpoints.
 *
 * @module api/authApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';

/**
 * Authenticate employee credentials against API.
 * @param {Object} credentials - User credentials ({ email, password }).
 * @returns {Promise<Object>} API response payload containing user data and JWT token.
 */
export const login = (credentials) => api.post(API.AUTH.LOGIN, credentials);

/**
 * Terminate active session and invalidate JWT token server-side.
 * @returns {Promise<Object>} API response payload.
 */
export const logout = () => api.post(API.AUTH.LOGOUT);

/**
 * Fetch authenticated user summary (/auth/me).
 * @returns {Promise<Object>} Basic user profile data.
 */
export const me = () => api.get(API.AUTH.ME);

/**
 * Fetch complete profile details (/users/profile) including department, grade, job title, and manager.
 * Used on app reloads to hydrate state with comprehensive employee data.
 * @returns {Promise<Object>} Detailed profile payload.
 */
export const profile = () => api.get(API.USERS.PROFILE);

/**
 * Update authenticated user password.
 * @param {Object} payload - Password update payload ({ current_password, new_password, new_password_confirmation }).
 * @returns {Promise<Object>} API success payload.
 */
export const changePassword = (payload) => api.post(API.AUTH.CHANGE_PASSWORD, payload);
