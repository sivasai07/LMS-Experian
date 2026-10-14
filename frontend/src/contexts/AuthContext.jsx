/**
 * @file AuthContext.jsx
 * @description Centralized Authentication & User Session Management Context Provider.
 * Encapsulates JWT authentication bootstrap, login credential submission, token storage lifecycle,
 * current user profile cache, dynamic name normalization, and logout operations.
 */

import { createContext, useCallback, useEffect, useState } from 'react';
import * as authApi from '../api/authApi';
import { storage } from '../utils/storage';
import { getFullName } from '../utils/userHelpers';

/**
 * React Context object exposing authentication state and session utilities.
 * @type {React.Context<Object|null>}
 */
export const AuthContext = createContext(null);

/**
 * Normalizes user record from API responses to ensure fallback name computation.
 * Combines `first_name` and `last_name` into a unified `name` field using helper utilities.
 *
 * @param {Object|null} user - Raw user payload from API.
 * @returns {Object|null} User record with computed `name` property.
 */
function normalizeUser(user) {
  if (!user) return null;
  return { ...user, name: getFullName(user) };
}

/**
 * Global Authentication Provider Component.
 * Wraps the application to supply session state, current user data, and authentication actions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components requiring auth context.
 * @returns {JSX.Element} AuthContext Provider tree.
 */
export function AuthProvider({ children }) {
  /* ── State Management ── */
  const [user, setUser]              = useState(null);
  const [loading, setLoading]        = useState(true);
  const [isAuthenticated, setIsAuth] = useState(false);

  /**
   * Session Initialization & Token Verification Effect.
   * On initial mount, reads JWT token from persistent storage and validates token validity
   * via the `/auth/me` endpoint. Purges invalid tokens automatically on failure.
   */
  useEffect(() => {
    const token = storage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((res) => {
        // API response structure: { success: true, data: UserResource }
        setUser(normalizeUser(res.data));
        setIsAuth(true);
      })
      .catch(() => {
        storage.removeToken();
        setIsAuth(false);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Submits login credentials to authenticate user and initialize session.
   *
   * @param {Object} credentials - User credentials object ({ email, password }).
   * @returns {Promise<Object>} Response payload containing JWT token and user details.
   */
  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const payload = res.data; // Expected shape: { token, user, force_password_change }
    storage.setToken(payload.token);
    setUser(normalizeUser(payload.user));
    setIsAuth(true);
    return payload;
  }, []);

  /**
   * Terminates active user session, invalidates server token, and clears client storage.
   *
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* Gracefully catch API logout errors; client storage purge is mandatory */
    }
    storage.removeToken();
    setUser(null);
    setIsAuth(false);
  }, []);

  /**
   * Re-fetches current user profile from server to sync updated roles/permissions/data.
   *
   * @returns {Promise<void>}
   */
  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(normalizeUser(res.data));
    } catch {
      /* Silent error suppression for background user refresh */
    }
  }, []);

  /**
   * Performs shallow local state updates on the cached user object (e.g. avatar or name update).
   *
   * @param {Object} partial - Partial user attributes to merge into active user state.
   */
  const updateUser = useCallback((partial) => {
    setUser((prev) => normalizeUser({ ...prev, ...partial }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
