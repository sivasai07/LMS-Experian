/**
 * @file dashboardSlice.js
 * @description Redux Toolkit Dashboard Analytics State Management Slice.
 * Manages async data fetching thunks (`fetchEmployeeDashboard`, `fetchManagerDashboard`, `fetchHrDashboard`)
 * and stores role-specific dashboard metrics, leave summary statistics, and loading states.
 *
 * @module store/slices/dashboardSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as dashboardApi from '../../api/dashboardApi';

/**
 * Fetch Employee Dashboard analytics thunk.
 */
export const fetchEmployeeDashboard = createAsyncThunk(
  'dashboard/fetchEmployee',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getEmployeeDashboard();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load dashboard' });
    }
  }
);

/**
 * Fetch Manager Dashboard analytics thunk.
 */
export const fetchManagerDashboard = createAsyncThunk(
  'dashboard/fetchManager',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getManagerDashboard();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load dashboard' });
    }
  }
);

/**
 * Fetch HR Dashboard analytics thunk.
 */
export const fetchHrDashboard = createAsyncThunk(
  'dashboard/fetchHr',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getHrDashboard();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load dashboard' });
    }
  }
);

const initialState = {
  data: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    /** Clear cached dashboard data and error state. */
    clearDashboard: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Employee Dashboard
      .addCase(fetchEmployeeDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchEmployeeDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load dashboard';
      })
      // Manager Dashboard
      .addCase(fetchManagerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchManagerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load dashboard';
      })
      // HR Dashboard
      .addCase(fetchHrDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHrDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHrDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load dashboard';
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
