import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-cf-primary';
      case 'secondary':
        return 'btn-cf-secondary';
      case 'success':
        return 'btn-cf-success';
      case 'danger':
        return 'btn-cf-danger';
      case 'outline':
        return 'btn-cf-outline';
      case 'light':
        return 'btn btn-light text-secondary border';
      default:
        return 'btn-cf-primary';
    }
  };

  const getSizeClass = () => {
    if (size === 'sm') return 'py-1 px-2 text-xs';
    if (size === 'lg') return 'py-3 px-4 text-base';
    return '';
  };

  return (
    <button
      type={type}
      className={`${getVariantClass()} ${getSizeClass()} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'start' && <i className={`bi ${icon} me-1`} />}
          <span>{children}</span>
          {icon && iconPosition === 'end' && <i className={`bi ${icon} ms-1`} />}
        </>
      )}
    </button>
  );
};

export default Button;
