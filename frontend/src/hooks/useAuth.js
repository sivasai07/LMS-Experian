/**
 * @file useAuth.js
 * @description Custom React Hook for Authentication & Session Access.
 * Exposes Redux-backed authentication state (user, loading status, authentication flags)
 * and dispatches authentication thunks (login, logout, token check, user updates).
 */

import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { loginThunk, logoutThunk, checkAuthThunk, updateUser } from '../store/slices/authSlice';

/**
 * Custom hook to interact with global authentication state and dispatch auth thunks.
 * Provides backwards-compatible API mapping matching the legacy AuthContext interface.
 *
 * @returns {Object} Object containing:
 *   - user {Object|null}: Currently authenticated user object.
 *   - loading {boolean}: Session bootstrap or request loading state.
 *   - isAuthenticated {boolean}: True if valid session exists.
 *   - error {string|null}: Recent authentication error message.
 *   - login {Function}: Async function to authenticate with credentials.
 *   - logout {Function}: Async function to terminate session.
 *   - checkAuth {Function}: Async function to re-verify token with backend.
 *   - updateUser {Function}: Function to update cached user profile data locally.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const { user, loading, isAuthenticated, error } = useSelector((state) => state.auth);

  /**
   * Dispatches login thunk with user credentials.
   *
   * @param {Object} credentials - Object containing email and password.
   * @returns {Promise<Object>} Unwrapped payload on success or throws rejected payload.
   */
  const login = useCallback(
    async (credentials) => {
      const resultAction = await dispatch(loginThunk(credentials));
      if (loginThunk.rejected.match(resultAction)) {
        throw resultAction.payload;
      }
      return resultAction.payload;
    },
    [dispatch]
  );

  /**
   * Dispatches logout thunk to invalidate session and clear local token.
   *
   * @returns {Promise<void>}
   */
  const logout = useCallback(
    async () => {
      await dispatch(logoutThunk());
    },
    [dispatch]
  );

  /**
   * Dispatches checkAuth thunk to re-verify active JWT token with backend.
   *
   * @returns {Promise<void>}
   */
  const checkAuth = useCallback(
    async () => {
      await dispatch(checkAuthThunk());
    },
    [dispatch]
  );

  /**
   * Dispatches local state update action to mutate cached user profile fields.
   *
   * @param {Object} partial - Object containing partial user field updates.
   */
  const updateUserInfo = useCallback(
    (partial) => {
      dispatch(updateUser(partial));
    },
    [dispatch]
  );

  return {
    user,
    loading,
    isAuthenticated,
    error,
    login,
    logout,
    checkAuth,
    updateUser: updateUserInfo,
  };
}
