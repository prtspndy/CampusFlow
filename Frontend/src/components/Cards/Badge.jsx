import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  pill = true,
  icon,
  className = '',
}) => {
  const getBadgeClass = () => {
    switch (variant) {
      case 'primary':
        return 'cf-badge-primary';
      case 'secondary':
        return 'cf-badge-secondary';
      case 'success':
        return 'cf-badge-success';
      case 'warning':
        return 'cf-badge-warning';
      case 'danger':
        return 'cf-badge-danger';
      case 'neutral':
      default:
        return 'cf-badge-neutral';
    }
  };

  return (
    <span
      className={`cf-badge ${getBadgeClass()} ${
        pill ? 'rounded-pill' : 'rounded'
      } ${className}`}
    >
      {icon && <i className={`bi ${icon}`} />}
      {children}
    </span>
  );
};

export default Badge;
