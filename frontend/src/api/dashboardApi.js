/**
 * @file dashboardApi.js
 * @description Dashboard & Analytics API Services.
 * Fetches aggregated statistics, pending request counters, leave summary donuts,
 * and upcoming events customized per RBAC role (Employee, Manager, HR).
 *
 * @module api/dashboardApi
 */

import api from './axios';
import { API } from '../constants/apiEndpoints';

/**
 * Fetch Employee Dashboard metrics (balances, personal request counters, upcoming holidays).
 * @returns {Promise<Object>} Employee analytics payload.
 */
export const getEmployeeDashboard = () => api.get(API.DASHBOARD.EMPLOYEE);

/**
 * Fetch Manager Dashboard metrics (pending approvals list, team leave summary, team on leave today).
 * @returns {Promise<Object>} Manager analytics payload.
 */
export const getManagerDashboard = () => api.get(API.DASHBOARD.MANAGER);

/**
 * Fetch HR Dashboard metrics (total company employees, company-wide leave summary donut, department breakdowns).
 * @returns {Promise<Object>} HR analytics payload.
 */
export const getHrDashboard = () => api.get(API.DASHBOARD.HR);
