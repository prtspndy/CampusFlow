import React from 'react';

const StatusChip = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = status.toString().trim().toLowerCase();

  let variant = 'neutral';
  let dotColor = '#94A3B8';

  if (['active', 'paid', 'completed', 'fulfilled', 'settled', 'approved', 'checked in'].includes(normalized)) {
    variant = 'success';
    dotColor = 'var(--cf-success)';
  } else if (['in progress', 'processing', 'pro member', 'executive', 'upcoming'].includes(normalized)) {
    variant = 'primary';
    dotColor = 'var(--cf-primary)';
  } else if (['pending', 'review', 'warning', 'partially paid'].includes(normalized)) {
    variant = 'warning';
    dotColor = 'var(--cf-warning)';
  } else if (['inactive', 'overdue', 'cancelled', 'rejected', 'danger'].includes(normalized)) {
    variant = 'danger';
    dotColor = 'var(--cf-danger)';
  } else if (['basic member', 'general'].includes(normalized)) {
    variant = 'secondary';
    dotColor = 'var(--cf-secondary)';
  }

  return (
    <span className={`cf-badge cf-badge-${variant} py-1 px-2.5 ${className}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
          marginRight: '4px',
        }}
      />
      {status}
    </span>
  );
};

export default StatusChip;
