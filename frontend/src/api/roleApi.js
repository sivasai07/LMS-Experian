/**
 * @file roleApi.js
 * @description Role Management API Services.
 * Provides endpoints for retrieving application RBAC roles (Employee, Manager, HR).
 *
 * @module api/roleApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';

/**
 * Fetch all application access control roles.
 * @returns {Promise<Object>} Role collection payload.
 */
export const getRoles = () => api.get(API.ROLES.BASE);
