import React from 'react';

const ContentCard = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  footer,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => {
  return (
    <div className={`cf-card ${className}`}>
      {(title || actions) && (
        <div className="cf-card-header">
          <div className="d-flex align-items-center gap-2">
            {icon && (
              <span className="text-primary fs-5 d-flex align-items-center">
                <i className={`bi ${icon}`} />
              </span>
            )}
            <div>
              {title && <h5 className="mb-0 fs-6 fw-bold">{title}</h5>}
              {subtitle && <p className="mb-0 text-muted small">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`${noPadding ? 'p-0' : 'cf-card-body'} ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="p-3 border-top border-light-subtle bg-light bg-opacity-25 rounded-bottom">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContentCard;
