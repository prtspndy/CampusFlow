import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-dark-muted light:text-light-muted">
            {label}
            {props.required && <span className="text-status-error-text ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full h-[38px] px-3 text-sm rounded-lg bg-[#122131] text-[#d4e4fa] border border-[#273647] placeholder:text-[#8e8fa3]/60 transition-colors focus:outline-none focus:border-[#0047FF] focus:ring-1 focus:ring-[#0047FF] disabled:opacity-50 disabled:cursor-not-allowed',
            'light:bg-white light:text-slate-900 light:border-slate-300 light:placeholder:text-slate-400',
            error && 'border-status-error-text focus:border-status-error-text focus:ring-status-error-text/20',
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-error-text font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-dark-muted light:text-light-muted">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
