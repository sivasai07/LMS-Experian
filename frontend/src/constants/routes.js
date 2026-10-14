/**
 * @file routes.js
 * @description Centralized React Router Route Path Definitions.
 * Organizes application routes by visibility (Public, Shared Authenticated, Employee, Manager, HR Admin)
 * preventing hardcoded URL string typos across component navigation links.
 *
 * @module constants/routes
 */

export const ROUTES = {
  // Public Routes
  HOME: '/',
  LOGIN: '/login',

  // Shared Authenticated Routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',

  // Employee Routes
  MY_LEAVES: '/my-leaves',
  APPLY_LEAVE: '/apply-leave',

  // Manager Routes
  TEAM_LEAVES: '/team-leaves',
  TEAM: '/team',

  // HR / Admin Master Management Routes
  EMPLOYEES: '/employees',
  EMPLOYEES_NEW: '/employees/new',
  EMPLOYEES_EDIT: '/employees/:id/edit',
  LEAVE_REQUESTS: '/leave-requests',
  LEAVE_TYPES: '/leave-types',
  DEPARTMENTS: '/departments',
  GRADES: '/grades',
  JOB_TITLES: '/job-titles',
  GRADE_JOB_TITLES: '/grade-job-titles',
  HOLIDAYS: '/holidays',
  REPORTS: '/reports',
};
