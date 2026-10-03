import React, { useEffect } from 'react';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // sm, md, lg, xl
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getMaxWidth = () => {
    switch (size) {
      case 'sm':
        return '400px';
      case 'lg':
        return '800px';
      case 'xl':
        return '1040px';
      case 'md':
      default:
        return '560px';
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 animate-fade-in"
      style={{
        zIndex: 1060,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="cf-card bg-white w-100 shadow-lg border-0 overflow-hidden d-flex flex-column"
        style={{
          maxWidth: getMaxWidth(),
          maxHeight: '90vh',
          borderRadius: 'var(--cf-radius-md)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between p-4 border-bottom border-light-subtle">
          <div>
            {title && <h5 className="fw-bold mb-0 text-dark fs-5">{title}</h5>}
            {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light border-0 rounded-circle text-muted p-1"
            style={{ width: '32px', height: '32px' }}
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-grow-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-3 px-4 border-top border-light-subtle bg-light bg-opacity-50 d-flex align-items-center justify-content-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
