/**
 * @file date.js
 * @description Date Parsing, Formatting, and Temporal Helper Functions.
 * Provides timezone-safe formatting (en-GB, ISO input dates), date-time formatting with AM/PM timestamps,
 * calendar day difference calculations, and relative time ago strings using native Intl API implementations.
 *
 * @module utils/date
 */

/**
 * Format a date string or object to a human-readable date string (e.g. "12 Aug 2026").
 * Uses British English ('en-GB') locale for standardized day-month-year ordering.
 * @param {string|Date} date - Date representation.
 * @param {Intl.DateTimeFormatOptions} [opts] - Formatting options override.
 * @returns {string} Formatted date string or fallback '—'.
 */
export function formatDate(date, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', opts).format(d);
}

/**
 * Format a date string or object to a full date and 12-hour AM/PM time string (e.g. "12 Aug 2026, 05:30 PM").
 * @param {string|Date} date - Date representation.
 * @returns {string} Formatted date and time string or fallback '—'.
 */
export function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format a date object as an ISO local date string YYYY-MM-DD (suitable for HTML5 input[type=date]).
 * Avoids UTC offset shifts by extracting local year, month, and day integers directly.
 * @param {string|Date} date - Date representation.
 * @returns {string} Formatted ISO date string (YYYY-MM-DD).
 */
export function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the total number of calendar days between two date strings (inclusive of start and end).
 * @param {string} from - Start date string (YYYY-MM-DD).
 * @param {string} to - End date string (YYYY-MM-DD).
 * @returns {number} Integer day count (>= 0).
 */
export function daysBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  const diff = b - a;
  return diff < 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Determines if a given date string or Date object falls on today's calendar date.
 * @param {string|Date} date - Date representation.
 * @returns {boolean} True if date matches today in local timezone.
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Format a relative time string (e.g. "2 hours ago", "In 3 days").
 * @param {string|Date} date - Input date.
 * @returns {string} Relative time phrase.
 */
export function formatTimeAgo(date) {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;

  return formatDate(date);
}
