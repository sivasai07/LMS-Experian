/**
 * @file useApi.js
 * @description Custom Asynchronous API Execution Hook.
 * Wraps arbitrary API promises with standardized loading, error state extraction, data persistence,
 * and execution reset capabilities for React components.
 *
 * @module hooks/useApi
 */

import { useCallback, useState } from 'react';
import { extractApiError } from '../utils/helpers';

/**
 * Custom hook wrapping an asynchronous API function with reactive execution state.
 *
 * @param {Function} apiFn - Asynchronous API service function returning a Promise.
 * @returns {{ data: any, loading: boolean, error: string|null, execute: Function, reset: Function }} Reactive API state and trigger controls.
 *
 * @example
 * const { data, loading, error, execute } = useApi(leaveApi.getMyLeaves);
 * useEffect(() => { execute({ page: 1 }); }, [execute]);
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Triggers execution of wrapped API promise with provided arguments.
   */
  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const msg = extractApiError(err.response?.data);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn],
  );

  /**
   * Resets data, error, and loading state back to initial values.
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
