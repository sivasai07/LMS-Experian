/**
 * @file storage.js
 * @description Persistent & Session Storage Abstraction Layer.
 * Provides safe storage access for JWT authentication tokens (configurable via `VITE_TOKEN_STORAGE_TYPE`)
 * and theme settings (persisted in localStorage across browser sessions).
 *
 * @module utils/storage
 */

const TOKEN_KEY = 'lms_token';
const THEME_KEY = 'lms_theme';

// Configurable storage engine: 'session' (default tab session) or 'local' (persistent across restarts)
const TOKEN_STORAGE_TYPE = import.meta.env.VITE_TOKEN_STORAGE_TYPE || 'session';

/**
 * Returns the configured web storage engine for token storage.
 * @returns {Storage} Window localStorage or sessionStorage reference.
 */
const getStorageEngine = () => {
  return TOKEN_STORAGE_TYPE === 'local' ? window.localStorage : window.sessionStorage;
};

export const storage = {
  /** Retrieve stored JWT authentication token string. */
  getToken: () => getStorageEngine().getItem(TOKEN_KEY),
  /** Store JWT authentication token string. */
  setToken: (token) => getStorageEngine().setItem(TOKEN_KEY, token),
  /** Purge stored JWT authentication token string. */
  removeToken: () => getStorageEngine().removeItem(TOKEN_KEY),

  /** Retrieve persisted theme setting ('light' | 'dark'). */
  getTheme: () => window.localStorage.getItem(THEME_KEY),
  /** Store theme setting ('light' | 'dark') in localStorage. */
  setTheme: (theme) => window.localStorage.setItem(THEME_KEY, theme),
};
