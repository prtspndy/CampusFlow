import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items = [], title, actionButton }) => {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        {items.length > 0 && (
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-xs">
              <li className="breadcrumb-item">
                <Link to="/dashboard" className="text-muted text-decoration-none">
                  <i className="bi bi-house-door me-1" />
                  CampusFlow
                </Link>
              </li>
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                  <li
                    key={index}
                    className={`breadcrumb-item ${isLast ? 'active text-secondary fw-semibold' : ''}`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {isLast || !item.path ? (
                      item.label
                    ) : (
                      <Link to={item.path} className="text-muted text-decoration-none">
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        {title && <h2 className="fs-4 fw-bold text-dark mb-0">{title}</h2>}
      </div>

      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default Breadcrumb;
