import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Buttons/Button';

const NotFound = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5 text-center">
      <div
        className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-4"
        style={{ width: '96px', height: '96px', fontSize: '2.5rem' }}
      >
        <i className="bi bi-compass" />
      </div>
      <h1 className="display-4 fw-bold text-dark mb-2">404</h1>
      <h4 className="fw-semibold text-secondary mb-3">Page Not Found</h4>
      <p className="text-muted mb-4" style={{ maxWidth: '420px' }}>
        The student portal page you are looking for doesn't exist, has been moved, or is restricted to other officer roles.
      </p>
      <div className="d-flex gap-3">
        <Link to="/dashboard">
          <Button variant="primary" icon="bi-house-door-fill">
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/members">
          <Button variant="outline" icon="bi-people">
            Browse Directory
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
