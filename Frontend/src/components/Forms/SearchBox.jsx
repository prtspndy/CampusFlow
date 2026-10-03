import React from 'react';

const SearchBox = ({
  value = '',
  onChange,
  placeholder = 'Search records...',
  className = '',
  size = 'md',
}) => {
  return (
    <div className={`position-relative ${className}`} style={{ minWidth: '220px' }}>
      <i
        className="bi bi-search position-absolute top-50 translate-middle-y text-muted"
        style={{ left: '12px', fontSize: size === 'sm' ? '0.75rem' : '0.875rem' }}
      />
      <input
        type="text"
        className={`cf-input ${size === 'sm' ? 'py-1 ps-4 pe-4 text-xs' : 'ps-4 pe-4'}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: '34px !important' }}
      />
      {value && (
        <button
          type="button"
          className="btn btn-link btn-sm position-absolute top-50 translate-middle-y text-muted p-0 border-0"
          style={{ right: '10px' }}
          onClick={() => onChange('')}
          title="Clear search"
        >
          <i className="bi bi-x-circle-fill" />
        </button>
      )}
    </div>
  );
};

export default SearchBox;
