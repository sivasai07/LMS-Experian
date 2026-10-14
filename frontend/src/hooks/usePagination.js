/**
 * @file usePagination.js
 * @description Custom React Hook for Table & List Data Pagination.
 * Encapsulates page number state, per-page limit tracking, and navigation helper callbacks.
 *
 * @module hooks/usePagination
 */

import { useState } from 'react';

/**
 * Custom Hook — Manages data table pagination state and controls.
 * @param {number} [initialPage=1] - Starting page number (1-indexed).
 * @param {number} [initialPerPage=10] - Number of records rendered per page.
 * @returns {Object} Pagination controls ({ page, perPage, setPage, setPerPage, nextPage, prevPage, goToPage, reset }).
 */
export function usePagination(initialPage = 1, initialPerPage = 10) {
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToPage = (n) => setPage(n);
  const reset = () => setPage(initialPage);

  return { page, perPage, setPage, setPerPage, nextPage, prevPage, goToPage, reset };
}
