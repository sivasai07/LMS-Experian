/**
 * @file EmptyState.jsx
 * @description Standardized Empty Result State Display Component.
 * Rendered across tables, cards, and filter result sets when zero matching records exist.
 *
 * @module components/common/EmptyState
 */

import { RiInboxLine } from 'react-icons/ri';
import './EmptyState.css';

/**
 * Reusable EmptyState Component.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} [props.icon] - Custom icon element (defaults to Inbox icon).
 * @param {string} [props.title='Nothing here'] - Empty state primary heading.
 * @param {string} [props.description] - Secondary explanatory message.
 * @param {React.ReactNode} [props.action] - Optional call-to-action button or reset trigger.
 */
export default function EmptyState({
  icon,
  title = 'Nothing here',
  description,
  action,
}) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-icon">{icon ?? <RiInboxLine />}</span>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
