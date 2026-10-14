/**
 * @file userSlice.js
 * @description Redux Toolkit Employee & Team Data Management State Slice.
 * Handles async thunks (`fetchDirectReports`, `fetchEmployees`) for manager team rosters
 * and HR employee directory management.
 *
 * @module store/slices/userSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userApi from '../../api/userApi';

/**
 * Fetch manager's direct reports / team members thunk.
 */
export const fetchDirectReports = createAsyncThunk(
  'user/fetchDirectReports',
  async (params, { rejectWithValue }) => {
    try {
      const res = await userApi.getTeam(params);
      return res; // { data: [...], meta: ... }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch team members' });
    }
  }
);

/**
 * Fetch paginated list of company employees (HR View) thunk.
 */
export const fetchEmployees = createAsyncThunk(
  'user/fetchEmployees',
  async (params, { rejectWithValue }) => {
    try {
      const res = await userApi.getUsers(params);
      return res; // { data: [...], meta: ... }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch employees' });
    }
  }
);

const initialState = {
  directReports: [],
  directReportsMeta: null,
  directReportsLoading: false,
  employees: [],
  employeesMeta: null,
  employeesLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /** Clear active user error message. */
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Direct Reports
      .addCase(fetchDirectReports.pending, (state) => {
        state.directReportsLoading = true;
        state.error = null;
      })
      .addCase(fetchDirectReports.fulfilled, (state, action) => {
        state.directReportsLoading = false;
        state.directReports = action.payload.data || [];
        state.directReportsMeta = action.payload.meta || null;
      })
      .addCase(fetchDirectReports.rejected, (state, action) => {
        state.directReportsLoading = false;
        state.error = action.payload?.message || 'Failed to fetch team members';
      })
      // Employees
      .addCase(fetchEmployees.pending, (state) => {
        state.employeesLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.employeesLoading = false;
        state.employees = action.payload.data || [];
        state.employeesMeta = action.payload.meta || null;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.employeesLoading = false;
        state.error = action.payload?.message || 'Failed to fetch employees';
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
