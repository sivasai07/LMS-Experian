/**
 * @file Modal.jsx
 * @description Accessible Dynamic Modal Dialog Component.
 * Supports configurable modal sizes (sm, md, lg, xl), header titles, body contents, custom footers,
 * background overlay click-dismissal, keyboard Escape handling, and body scroll locking.
 *
 * @module components/common/Modal
 */

import { useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import './Modal.css';

/**
 * Reusable Modal Component.
 * @param {Object} props - Modal properties.
 * @param {boolean} props.isOpen - Controls modal visibility state.
 * @param {Function} props.onClose - Dismissal callback handler.
 * @param {string} [props.title] - Modal header title.
 * @param {React.ReactNode} props.children - Modal body content.
 * @param {React.ReactNode} [props.footer] - Modal action buttons footer element.
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Container sizing variant.
 * @param {boolean} [props.closeOnOverlay=true] - Whether clicking outside dismisses modal.
 * @returns {React.ReactNode|null} Dialog modal element or null.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}) {
  // Bind keyboard Escape key listener for accessible modal dismissal
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  // Lock background window body scroll while modal is active
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`modal modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close modal">
              <RiCloseLine />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
