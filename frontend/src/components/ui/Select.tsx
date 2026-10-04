import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, children, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-dark-muted light:text-light-muted">
            {label}
            {props.required && <span className="text-status-error-text ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full h-[38px] px-3 text-sm rounded-lg bg-[#122131] text-[#d4e4fa] border border-[#273647] transition-colors focus:outline-none focus:border-[#0047FF] focus:ring-1 focus:ring-[#0047FF] disabled:opacity-50 disabled:cursor-not-allowed',
            'light:bg-white light:text-slate-900 light:border-slate-300',
            error && 'border-status-error-text focus:border-status-error-text focus:ring-status-error-text/20',
            className,
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-dark-surface text-dark-text">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="text-xs text-status-error-text font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-dark-muted light:text-light-muted">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
