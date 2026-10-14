/**
 * @file Button.jsx
 * @description Reusable Action Button Component.
 * Supports variants (primary, secondary, success, danger, warning, ghost), sizes, full-width layouts,
 * icons, and intelligent loading states ("Saving...", "Creating...", "Submitting...").
 */

import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    loading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Derive smart action label when button is in loading state.
   * Converts "Save Changes" -> "Saving...", "Create Department" -> "Creating...", etc.
   */
  const getDisplayText = () => {
    if (!loading) return children;
    if (loadingText) return loadingText;

    if (typeof children === 'string') {
      const lower = children.toLowerCase().trim();
      if (lower.includes('save changes') || lower === 'save' || lower.includes('save employee') || lower.includes('save department')) {
        return 'Saving…';
      }
      if (lower.includes('create') || lower.includes('add')) {
        return 'Creating…';
      }
      if (lower.includes('submit')) {
        return 'Submitting…';
      }
      if (lower.includes('update')) {
        return 'Updating…';
      }
      if (lower.includes('delete')) {
        return 'Deleting…';
      }
    }
    return children;
  };

  return (
    <button type={type} className={classes} disabled={disabled || loading} onClick={onClick} {...props}>
      {loading ? (
        <>
          <span className="btn-spinner-inline" />
          <span>{getDisplayText()}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
