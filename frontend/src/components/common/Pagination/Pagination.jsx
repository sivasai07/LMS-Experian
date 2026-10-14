/**
 * @file Pagination.jsx
 * @description Accessible Data Table Pagination Control Bar.
 * Renders page navigation buttons, page size selector (5, 10, 15, 20, All), ellipsis page collapsing for large dataset ranges,
 * and current record range statistics ("Showing 1–10 of 50 results").
 *
 * @module components/common/Pagination
 */

import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import './Pagination.css';

/**
 * Pagination Component.
 * @param {Object} props - Pagination properties.
 * @param {Object} props.meta - Laravel API pagination metadata ({ current_page, from, to, per_page, total, last_page }).
 * @param {number} props.page - Current active page number.
 * @param {Function} props.onPageChange - Page selection callback handler.
 * @param {number} [props.perPage] - Current rows per page count.
 * @param {Function} [props.onPerPageChange] - Rows per page selection callback handler.
 * @param {Array<number|string>} [props.perPageOptions] - Page size dropdown options.
 * @returns {React.ReactNode|null} Rendered pagination controls.
 */
export default function Pagination({
  meta,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions = [5, 10, 15, 20, 'All'],
}) {
  if (!meta && !perPage) return null;

  const total = meta?.total ?? 0;
  const last_page = meta?.last_page ?? 1;
  const currentPerPage = perPage ?? meta?.per_page ?? 10;
  const from = meta?.from ?? (total > 0 ? (page - 1) * currentPerPage + 1 : 0);
  const to = meta?.to ?? Math.min(page * currentPerPage, total);

  /**
   * Build array of visible page numbers with intelligent ellipsis collapsing.
   * @returns {Array<number|string>} Page numbers and '...' strings.
   */
  const getPages = () => {
    const pages = [];
    const range = 2;
    for (let i = 1; i <= last_page; i++) {
      if (i === 1 || i === last_page || (i >= page - range && i <= page + range)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div
      className="pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span className="pagination-info">
          Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong> results
        </span>

        {onPerPageChange && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>Rows per page:</span>
            <select
              value={perPage >= 500 || perPage === 'All' ? 1000 : perPage}
              onChange={(e) => {
                const val = e.target.value === '1000' || e.target.value === 'All' ? 1000 : Number(e.target.value);
                onPerPageChange(val);
                onPageChange(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {perPageOptions.map((opt) => {
                const isAll = opt === 'All' || opt === 1000;
                const val = isAll ? 1000 : Number(opt);
                const label = isAll ? 'All' : opt;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {last_page > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <RiArrowLeftSLine />
          </button>

          {getPages().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="pagination-btn" style={{ cursor: 'default' }}>
                …
              </span>
            ) : (
              <button
                key={p}
                className={`pagination-btn ${p === page ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            ),
          )}

          <button
            className="pagination-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page === last_page}
            aria-label="Next page"
          >
            <RiArrowRightSLine />
          </button>
        </div>
      )}
    </div>
  );
}
