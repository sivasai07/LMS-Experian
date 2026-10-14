/**
 * All API endpoint paths relative to VITE_API_BASE_URL (/api/v1).
 * Backend uses /api/v1 prefix (see routes/api.php).
 */
export const API = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // Users (HR admin endpoints)
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
    RESTORE: (id) => `/users/${id}/restore`,
    PROFILE: '/users/profile',
    TEAM: '/users/direct-reports',
    MANAGERS: '/users/managers',
    EMPLOYEES: '/users/employees',
  },

  // Roles lookup
  ROLES: {
    BASE: '/roles',
  },

  // Grade–Job-Title combinations
  GRADE_JOB_TITLES: {
    BASE: '/grade-job-titles',
  },

  // Leave Requests (backend prefix: /leave-requests)
  LEAVE: {
    APPLY: '/leave-requests',
    MY: '/leave-requests/my',
    PENDING: '/leave-requests/pending',
    ALL: '/leave-requests',
    BY_ID: (id) => `/leave-requests/${id}`,
    APPROVE: (id) => `/leave-requests/${id}/approve`,
    REJECT: (id) => `/leave-requests/${id}/reject`,
    CANCEL: (id) => `/leave-requests/${id}/cancel`,
  },

  // Leave Balance
  BALANCE: {
    MY: '/leave-balances/my',
    BY_USER: (id) => `/users/${id}/leave-balances`,
  },

  // Leave Types
  LEAVE_TYPES: {
    BASE: '/leave-types',
    BY_ID: (id) => `/leave-types/${id}`,
  },

  // Holidays
  HOLIDAYS: {
    BASE: '/holidays',
    BY_ID: (id) => `/holidays/${id}`,
  },

  // Master Data
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id) => `/departments/${id}`,
  },
  GRADES: {
    BASE: '/grades',
    BY_ID: (id) => `/grades/${id}`,
  },
  JOB_TITLES: {
    BASE: '/job-titles',
    BY_ID: (id) => `/job-titles/${id}`,
  },

  // Dashboard
  DASHBOARD: {
    EMPLOYEE: '/dashboard/employee',
    MANAGER: '/dashboard/manager',
    HR: '/dashboard/hr',
  },
};
