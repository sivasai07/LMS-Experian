/**
 * @file helpers.js
 * @description Common Application Helper & Data Processing Utilities.
 * Provides functions for initials extraction, text formatting, query string generation,
 * multi-word starts-with search matching, API error message unwrapping, and defensive array extractions.
 *
 * @module utils/helpers
 */

/**
 * Generate up to 2 capital user initials from a full name string.
 * @param {string} name - Full user name (e.g. "Siva Sai").
 * @returns {string} Initials (e.g. "SS") or fallback '?'.
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

/**
 * Capitalise the first letter of a string.
 * @param {string} str - Raw string.
 * @returns {string} Capitalized string.
 */
export function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Clamp a numeric value within a specified minimum and maximum range.
 * @param {number} value - Input number.
 * @param {number} min - Lower bound constraint.
 * @param {number} max - Upper bound constraint.
 * @returns {number} Clamped numeric value.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format leave day quantities cleanly, preserving exact decimals (e.g. 1.67, 0.5, 20).
 * @param {number|string} val - Raw day count value.
 * @returns {string} Formatted string without trailing zero artifacts.
 */
export function formatDays(val) {
  const num = Number(val ?? 0);
  if (isNaN(num)) return '0';
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(1)));
}

/**
 * Build a URL query string from a key-value object, automatically filtering out null, undefined, or empty values.
 * @param {Record<string, any>} params - Parameter map.
 * @returns {string} Formatted query string (e.g. "?page=1&search=test") or empty string.
 */
export function buildQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

/**
 * Truncate a long string to maxLen characters, appending '...' if truncated.
 * @param {string} str - Raw text.
 * @param {number} [maxLen=50] - Maximum allowed length.
 * @returns {string} Truncated string.
 */
export function truncate(str, maxLen = 50) {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
}

/**
 * Checks if EVERY word in a multi-word search query matches the start of at least one word in targetText.
 * E.g., Query "sai dav" matches "Sivasai Davuluri" or "Sai Kumar Davuluri".
 *
 * @param {string} targetText - The text to search within.
 * @param {string} searchQuery - The user's input search query.
 * @returns {boolean} True if all words in search query match a word prefix in targetText.
 */
export function matchMultiWordStartsWith(targetText, searchQuery) {
  if (!searchQuery) return true;
  if (!targetText) return false;

  const queryWords = String(searchQuery)
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (queryWords.length === 0) return true;

  const targetWords = String(targetText)
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return queryWords.every((qWord) =>
    targetWords.some((tWord) => tWord.startsWith(qWord))
  );
}

/**
 * Extract a human-readable error message from any API error shape or Exception object.
 * @param {any} err - Error object or string.
 * @returns {string} Clean, user-facing error message.
 */
export function extractApiError(err) {
  if (!err) return 'Something went wrong.';

  // Plain string
  if (typeof err === 'string') return err;

  // Normalized error from our axios interceptor: { message, errors, status }
  if (err.errors && typeof err.errors === 'object') {
    const messages = Object.values(err.errors).flat();
    if (messages.length) return messages.join(' ');
  }
  if (err.message) return err.message;

  // Raw axios error shape
  if (err.response?.data) {
    const d = err.response.data;
    if (d.errors) {
      const messages = Object.values(d.errors).flat();
      if (messages.length) return messages.join(' ');
    }
    if (d.message) return d.message;
  }

  return 'Something went wrong.';
}

/**
 * Defensively extracts an array from heterogeneous API response structures.
 * @param {any} res - Raw response data.
 * @returns {Array} Extracted array or empty fallback `[]`.
 */
export function extractArray(res) {
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
}
