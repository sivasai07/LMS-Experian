/**
 * @file index.js
 * @description Centralized Redux Toolkit Store Configuration.
 * Combines global feature slices (auth, user, dashboard, leave) into a single Redux store instance.
 * Disables serializable checks to optimize passing complex domain response structures.
 *
 * @module store/index
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import dashboardReducer from './slices/dashboardSlice';
import leaveReducer from './slices/leaveSlice';

/** Configured Redux Toolkit global store instance. */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    dashboard: dashboardReducer,
    leave: leaveReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off for simpler Axios response payload passing
    }),
});

export default store;
