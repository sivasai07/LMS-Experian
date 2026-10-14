/**
 * @file useDebounce.js
 * @description Custom React Hook for Debouncing Fast-Changing State Inputs.
 * Used for optimizing search inputs and text queries before triggering server-side API requests.
 *
 * @module hooks/useDebounce
 */

import { useEffect, useState } from 'react';

/**
 * Custom Hook — Delays updating the returned state until the user halts input for a specified duration.
 * @param {T} value - Input value to debounce.
 * @param {number} [delay=400] - Delay threshold in milliseconds.
 * @returns {T} Debounced value.
 * @template T
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
