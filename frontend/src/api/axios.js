/**
 * @file axios.js
 * @description Centralized Axios HTTP Client Configuration.
 * Configures base API instance, default headers, request authorization interceptors (JWT Token injection),
 * response unwrapping, and global 401 unauthenticated session handling.
 *
 * @module api/axios
 */

import axios from 'axios';
import { storage } from '../utils/storage';

/**
 * Primary Axios instance initialized with environment base URL and timeouts.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor: Automatically injects Bearer JWT authentication header from storage if present.
 */
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor: Unwraps response payloads to return JSON body directly.
 * Intercepts 401 Unauthorized responses to purge expired tokens and perform safe session ejection.
 */
api.interceptors.response.use(
  // Unwrap: return response.data (the JSON body) directly
  (response) => response.data,

  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    // Construct a normalized, developer-friendly error structure
    const normalizedError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      errors: error.response?.data?.errors || null,
      status: status || null,
      code: error.response?.data?.code || error.code || null,
      isNetworkError: !error.response,
      // Retain response reference in case components need raw Axios access
      response: error.response,
    };

    // Only redirect on 401 for non-login endpoints
    // (login failure is a valid 401 that the component handles itself)
    if (status === 401 && !url.includes('/auth/login')) {
      storage.removeToken();
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(normalizedError);
  },
);

export default api;
