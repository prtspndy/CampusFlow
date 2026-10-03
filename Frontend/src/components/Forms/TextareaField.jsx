import React from 'react';

const TextareaField = React.forwardRef(({
  label,
  name,
  rows = 3,
  placeholder,
  error,
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

      <textarea
        ref={ref}
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        className={`cf-input ${error ? 'border-danger' : ''}`}
        {...props}
      />

      {error && <div className="text-danger small mt-1">{error}</div>}
      {!error && helperText && <div className="text-muted small mt-1">{helperText}</div>}
    </div>
  );
});

TextareaField.displayName = 'TextareaField';

export default TextareaField;
