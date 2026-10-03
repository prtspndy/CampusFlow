import React from 'react';
import { INITIAL_ORG_INFO } from '../../constants/mockData';

const Footer = () => {
  return (
    <footer
      className="bg-white border-top border-light-subtle px-4 py-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 text-xs text-muted"
      style={{ minHeight: 'var(--cf-footer-height)' }}
    >
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold text-secondary">
          {INITIAL_ORG_INFO.name}
        </span>
        <span>•</span>
        <span>CampusFlow v2.4 (Production Release)</span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <span className="d-inline-flex align-items-center gap-1.5 text-success">
          <span
            className="rounded-circle bg-success"
            style={{ width: '6px', height: '6px' }}
          />
          All Services Operational
        </span>
        <a href="#help" className="text-muted text-decoration-none hover-text-primary">
          Support
        </a>
        <a href="#docs" className="text-muted text-decoration-none hover-text-primary">
          User Guide
        </a>
      </div>
    </footer>
  );
};

export default Footer;
