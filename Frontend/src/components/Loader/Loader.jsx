import React from 'react';

const Loader = ({
  size = 'md',
  message = 'Loading data...',
  fullScreen = false,
  className = '',
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return { width: '1.25rem', height: '1.25rem', borderWidth: '0.15em' };
      case 'lg':
        return { width: '3rem', height: '3rem', borderWidth: '0.25em' };
      case 'md':
      default:
        return { width: '2rem', height: '2rem', borderWidth: '0.2em' };
    }
  };

  const content = (
    <div className={`d-flex flex-column align-items-center justify-content-center p-4 ${className}`}>
      <div
        className="spinner-border text-primary mb-3"
        style={getSpinnerSize()}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="text-muted small fw-medium mb-0">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75"
        style={{ zIndex: 1080 }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
