/**
 * @file leaveSlice.js
 * @description Redux Toolkit Leave Request & Balance Management State Slice.
 * Handles async thunks (`fetchMyLeaves`, `fetchMyBalances`) to maintain personal leave history,
 * pagination metadata, and live leave balance allocations.
 *
 * @module store/slices/leaveSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as leaveApi from '../../api/leaveApi';

/**
 * Fetch authenticated employee personal leave requests thunk.
 */
export const fetchMyLeaves = createAsyncThunk(
  'leave/fetchMyLeaves',
  async (params, { rejectWithValue }) => {
    try {
      const res = await leaveApi.getMyLeaves(params);
      return res; // { data: [...], meta: ... }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load leaves' });
    }
  }
);

/**
 * Fetch authenticated employee leave balance allocation thunk.
 */
export const fetchMyBalances = createAsyncThunk(
  'leave/fetchMyBalances',
  async (_, { rejectWithValue }) => {
    try {
      const res = await leaveApi.getMyBalances();
      return res.data; // [...]
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to load balances' });
    }
  }
);

const initialState = {
  myLeaves: [],
  myLeavesMeta: null,
  myLeavesLoading: false,
  myBalances: [],
  myBalancesLoading: false,
  error: null,
};

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    /** Clear active leave error message. */
    clearLeaveError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // My Leaves
      .addCase(fetchMyLeaves.pending, (state) => {
        state.myLeavesLoading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.myLeavesLoading = false;
        state.myLeaves = action.payload.data || [];
        state.myLeavesMeta = action.payload.meta || null;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.myLeavesLoading = false;
        state.error = action.payload?.message || 'Failed to load leaves';
      })
      // My Balances
      .addCase(fetchMyBalances.pending, (state) => {
        state.myBalancesLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBalances.fulfilled, (state, action) => {
        state.myBalancesLoading = false;
        state.myBalances = action.payload || [];
      })
      .addCase(fetchMyBalances.rejected, (state, action) => {
        state.myBalancesLoading = false;
        state.error = action.payload?.message || 'Failed to load balances';
      });
  },
});

export const { clearLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer;
