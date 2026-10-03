import React from 'react';

const InputField = React.forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  icon,
  helperText,
  required = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="cf-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="position-relative">
        {icon && (
          <span
            className="position-absolute top-50 translate-middle-y text-muted d-flex align-items-center"
            style={{ left: '12px' }}
          >
            <i className={`bi ${icon}`} />
          </span>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={`cf-input ${error ? 'border-danger' : ''} ${icon ? 'ps-5' : ''}`}
          {...props}
        />
      </div>

      {error && <div className="text-danger small mt-1">{error}</div>}
      {!error && helperText && <div className="text-muted small mt-1">{helperText}</div>}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
