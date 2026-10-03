import React from 'react';

const SelectField = React.forwardRef(({
  label,
  name,
  options = [],
  error,
  helperText,
  required = false,
  className = '',
  placeholder = 'Select option...',
  ...props
}, ref) => {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="cf-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={name}
        name={name}
        className={`cf-select ${error ? 'border-danger' : ''}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lab = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          );
        })}
      </select>

      {error && <div className="text-danger small mt-1">{error}</div>}
      {!error && helperText && <div className="text-muted small mt-1">{helperText}</div>}
    </div>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;
