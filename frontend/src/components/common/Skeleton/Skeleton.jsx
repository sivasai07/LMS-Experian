/**
 * @file Skeleton.jsx
 * @description Content Placeholder Skeleton Components.
 * Renders shimmering animated loading placeholders for text lines, table rows, and card layouts during data fetches.
 *
 * @module components/common/Skeleton
 */

import './Skeleton.css';

/**
 * Reusable Skeleton Line Component.
 * @param {Object} props
 * @param {string|number} [props.width] - Skeleton CSS width.
 * @param {string|number} [props.height] - Skeleton CSS height.
 * @param {string} [props.className=''] - Additional CSS classes.
 * @param {Object} [props.style={}] - Inline CSS style overrides.
 */
export default function Skeleton({ width, height, className = '', style = {} }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, display: 'block', ...style }}
      aria-hidden="true"
    />
  );
}

/** Pre-built table row skeleton loader */
export function TableRowSkeleton({ cols = 5, rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} aria-hidden="true">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} style={{ padding: '12px 16px' }}>
          <Skeleton height="14px" width={j === 0 ? '120px' : '80px'} />
        </td>
      ))}
    </tr>
  ));
}

/** Pre-built card list skeleton loader */
export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
