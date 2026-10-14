/**
 * @file NotificationContext.jsx
 * @description Global Toast Notification Context Provider.
 * Wraps react-hot-toast dispatchers to provide clean, unified success, error, info, warning,
 * and toast dismissal methods across frontend feature components.
 *
 * @module contexts/NotificationContext
 */

import { createContext, useCallback } from 'react';
import toast from 'react-hot-toast';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  /** Display success toast notification. */
  const success = useCallback((message) => {
    toast.success(message);
  }, []);

  /** Display error toast notification. */
  const error = useCallback((message) => {
    toast.error(message);
  }, []);

  /** Display informational toast notification. */
  const info = useCallback((message) => {
    toast(message, { icon: 'ℹ️' });
  }, []);

  /** Display warning toast notification. */
  const warning = useCallback((message) => {
    toast(message, { icon: '⚠️' });
  }, []);

  /** Dismiss specific active toast notification by ID. */
  const dismiss = useCallback((id) => {
    toast.dismiss(id);
  }, []);

  return (
    <NotificationContext.Provider value={{ success, error, info, warning, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}
