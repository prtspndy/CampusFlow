import React from 'react';
import Button from '../Buttons/Button';

const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No records found',
  description = 'There is currently no data to display for this view or filter.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-5 px-4 my-2 ${className}`}>
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
        style={{
          width: '64px',
          height: '64px',
          backgroundColor: 'var(--cf-border-light)',
          color: 'var(--cf-text-muted)',
          fontSize: '1.75rem',
        }}
      >
        <i className={`bi ${icon}`} />
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '360px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
