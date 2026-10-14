/**
 * @file Badge.jsx
 * @description Status Badge Tag Component.
 * Displays color-coded status badges for Leave Request statuses (Pending - yellow, Approved - green, Rejected/Cancelled - red),
 * user roles, and system tags.
 *
 * @module components/common/Badge
 */

import './Badge.css';

/**
 * Reusable Badge Component.
 * @param {Object} props - Badge properties.
 * @param {React.ReactNode} props.children - Tag label content.
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} [props.variant='default'] - Color scheme variant.
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Sizing option.
 * @param {string} [props.className=''] - Additional custom CSS class names.
 * @returns {React.ReactNode} Tag element.
 */
export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const classes = ['badge', `badge-${variant}`, `badge-${size}`, className].filter(Boolean).join(' ');
  return <span className={classes}>{children}</span>;
}
