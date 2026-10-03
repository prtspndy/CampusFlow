import React from 'react';

const Filter = ({
  options = [],
  value,
  onChange,
  label = 'Filter by',
  icon = 'bi-funnel',
  allLabel = 'All Options',
}) => {
  return (
    <div className="d-inline-flex align-items-center gap-2">
      <div className="position-relative">
        <i
          className={`bi ${icon} position-absolute top-50 translate-middle-y text-muted ps-2.5`}
          style={{ pointerEvents: 'none', fontSize: '0.85rem' }}
        />
        <select
          className="cf-select form-select form-select-sm ps-4 pe-4 py-1.5 text-xs bg-white border border-light-subtle rounded-3"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="">{allLabel}</option>
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default Filter;
