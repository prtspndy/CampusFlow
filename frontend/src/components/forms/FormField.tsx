import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  helperText?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  helperText,
  required = false,
  className,
  children,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-body-sm-medium text-[var(--color-ink)]"
        >
          {label}
          {required && (
            <span className="text-[var(--color-muted)] text-caption ml-1 font-normal">
              (required)
            </span>
          )}
        </label>
      </div>

      {children}

      {error ? (
        <p
          aria-live="polite"
          className="flex items-center gap-1.5 text-caption font-medium text-[var(--color-error)] mt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-caption text-[var(--color-muted)] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
