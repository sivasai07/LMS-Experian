/**
 * @file authSlice.js
 * @description Redux Toolkit Authentication State Management Slice.
 * Handles async authentication thunks (`loginThunk`, `logoutThunk`, `checkAuthThunk`), session storage synchronization,
 * cross-tab authentication broadcasting, normalized user object creation, and authentication state reducers.
 *
 * @module store/slices/authSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../../api/authApi';
import { storage } from '../../utils/storage';
import { getFullName } from '../../utils/userHelpers';
import { authSyncService } from '../../services/authSyncService';

/**
 * Normalize raw API user payload by computing derived fields such as full name.
 * @param {Object|null} user - Raw user payload from server.
 * @returns {Object|null} Normalized user object.
 */
function normalizeUser(user) {
  if (!user) return null;
  return { ...user, name: getFullName(user) };
}

/**
 * Login Async Thunk — Authenticates user credentials, persists JWT token to local storage,
 * broadcasts login event to sibling browser tabs, and normalizes user object for state.
 */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const envelope = await authApi.login(credentials);
      const payload = envelope.data ?? envelope;
      storage.setToken(payload.token);
      authSyncService.broadcastLogin();
      return normalizeUser(payload.user);
    } catch (err) {
      return rejectWithValue(err.response?.data || err || { message: 'Login failed' });
    }
  }
);

/**
 * Logout Async Thunk — Invalidates server session, purges stored JWT token, and notifies sibling tabs.
 * @param {boolean} [broadcast=true] - Whether to notify sibling tabs via BroadcastChannel.
 * Set to false when triggered BY a sibling tab event to prevent infinite broadcast loops.
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (broadcast = true) => {
    try {
      await authApi.logout();
    } catch {
      // Always clear local session even if server request fails
    } finally {
      storage.removeToken();
      if (broadcast) {
        authSyncService.broadcastLogout();
      }
    }
  }
);

/**
 * Session Verification Thunk — Hydrates auth state on initial app load or hard refresh.
 * Queries `/users/profile` to retrieve comprehensive user metadata (role, department, grade, job title).
 */
export const checkAuthThunk = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    const token = storage.getToken();
    if (!token) return null;
    try {
      // Use /users/profile instead of /auth/me to get complete user data
      // (name, role, department, phone, etc.) so Redux state is fully populated.
      const envelope = await authApi.profile();
      const user = envelope.data ?? envelope;
      return normalizeUser(user);
    } catch (err) {
      storage.removeToken();
      return rejectWithValue(err.response?.data || { message: 'Authentication expired' });
    }
  }
);

/**
 * Initial Authentication Redux State
 */
const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false,
  error: null,
};

/**
 * Redux Toolkit Auth Slice Configuration
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Partially update authenticated user state in Redux (e.g. after profile updates).
     */
    updateUser: (state, action) => {
      state.user = normalizeUser({ ...state.user, ...action.payload });
    },
    /**
     * Silent state purge — triggered by cross-tab logout broadcast without re-broadcasting.
     */
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(logoutThunk.pending, (state) => { state.loading = true; })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(checkAuthThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { updateUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
