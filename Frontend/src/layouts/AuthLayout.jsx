import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { INITIAL_ORG_INFO } from '../constants/mockData';

const AuthLayout = () => {
  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-between p-3 p-md-4"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top Header */}
      <div className="d-flex align-items-center justify-content-between max-w-xl mx-auto w-100 py-2">
        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white shadow-sm"
            style={{ width: '38px', height: '38px', fontWeight: 800 }}
          >
            <i className="bi bi-layers-fill fs-5" />
          </div>
          <span className="fw-bold fs-4 text-dark" style={{ letterSpacing: '-0.03em' }}>
            Campus<span className="text-primary">Flow</span>
          </span>
        </Link>
        <span className="badge bg-white border text-secondary px-3 py-1.5 rounded-pill shadow-xs text-xs">
          {INITIAL_ORG_INFO.shortName}
        </span>
      </div>

      {/* Main Form Center Box */}
      <div className="my-auto py-4 d-flex justify-content-center">
        <div style={{ width: '100%', maxWidth: '520px' }}>
          <Outlet />
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-muted small py-3">
        <span>© {new Date().getFullYear()} {INITIAL_ORG_INFO.name}. All rights reserved.</span>
      </div>
    </div>
  );
};

export default AuthLayout;
