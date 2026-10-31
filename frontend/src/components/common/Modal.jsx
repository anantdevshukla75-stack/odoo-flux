import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button.jsx';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '550px'
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: '4px', borderRadius: '4px' }}
          >
            <X style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
