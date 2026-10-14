/**
 * @file PageHeader.jsx
 * @description Standardized Page Header Component.
 * Renders page title, optional subtitle, and right-aligned action buttons/controls.
 *
 * @module components/layout/PageHeader
 */

import './PageHeader.css';

/**
 * Standardized PageHeader Component.
 * @param {Object} props
 * @param {string} props.title - Page title heading.
 * @param {string} [props.subtitle] - Secondary descriptive text.
 * @param {React.ReactNode} [props.actions] - Action buttons or filters rendered on the right.
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
