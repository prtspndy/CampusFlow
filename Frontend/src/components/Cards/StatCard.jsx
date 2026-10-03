import React from 'react';

const StatCard = ({
  title,
  value,
  icon,
  change,
  trend = 'up',
  color = 'primary',
  onClick,
  className = '',
}) => {
  const getIconStyles = () => {
    switch (color) {
      case 'primary':
        return { bg: 'var(--cf-primary-light)', text: 'var(--cf-primary)' };
      case 'secondary':
        return { bg: 'var(--cf-secondary-light)', text: 'var(--cf-secondary)' };
      case 'success':
        return { bg: 'var(--cf-success-light)', text: 'var(--cf-success)' };
      case 'warning':
        return { bg: 'var(--cf-warning-light)', text: 'var(--cf-warning)' };
      case 'danger':
        return { bg: 'var(--cf-danger-light)', text: 'var(--cf-danger)' };
      default:
        return { bg: 'var(--cf-primary-light)', text: 'var(--cf-primary)' };
    }
  };

  const getTrendBadge = () => {
    if (!change) return null;
    let badgeClass = 'cf-badge-primary';
    let trendIcon = 'bi-arrow-up-right';

    if (trend === 'up') {
      badgeClass = 'cf-badge-success';
      trendIcon = 'bi-arrow-up-short';
    } else if (trend === 'down') {
      badgeClass = 'cf-badge-danger';
      trendIcon = 'bi-arrow-down-short';
    } else if (trend === 'warning') {
      badgeClass = 'cf-badge-warning';
      trendIcon = 'bi-exclamation-circle';
    } else {
      badgeClass = 'cf-badge-neutral';
      trendIcon = 'bi-dash';
    }

    return (
      <span className={`cf-badge ${badgeClass} text-nowrap`}>
        <i className={`bi ${trendIcon}`} />
        {change}
      </span>
    );
  };

  const iconStyle = getIconStyles();

  return (
    <div
      className={`cf-card cf-card-hover p-4 h-100 d-flex flex-column justify-content-between ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <span className="text-secondary small fw-medium text-uppercase letter-spacing-1 d-block mb-1">
            {title}
          </span>
          <h3 className="mb-0 fw-bold fs-3 text-dark">{value}</h3>
        </div>
        <div
          className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: iconStyle.bg,
            color: iconStyle.text,
            fontSize: '1.35rem',
          }}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light-subtle">
        {getTrendBadge()}
        <span className="text-muted small">vs last period</span>
      </div>
    </div>
  );
};

export default StatCard;
