/**
 * @file Card.jsx
 * @description Surface Card Container Component.
 * Encapsulates section content with custom title headers, action toolbar controls, and padding options.
 *
 * @module components/common/Card
 */

import './Card.css';

/**
 * Reusable Card Component.
 * @param {Object} props - Card component properties.
 * @param {string|React.ReactNode} [props.title] - Card header section title.
 * @param {React.ReactNode} [props.actions] - Header action toolbar elements (e.g. filter buttons).
 * @param {React.ReactNode} props.children - Inner card content.
 * @param {string} [props.className=''] - Additional custom CSS class names.
 * @param {boolean} [props.padding=true] - Toggles internal body padding.
 * @returns {React.ReactNode} Container card element.
 */
export default function Card({ title, actions, children, className = '', padding = true }) {
  const classes = ['card', padding ? '' : 'card-no-padding', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
