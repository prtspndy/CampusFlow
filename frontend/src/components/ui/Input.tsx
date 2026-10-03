import React from 'react'
import { cn } from '../../lib/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full h-12 px-4 text-body-md font-body rounded-[10px] bg-[var(--color-canvas)] text-[var(--color-ink)] transition-colors',
          'placeholder:text-[var(--color-subtle)] focus:outline-none',
          hasError
            ? 'border-2 border-[var(--color-error)]'
            : 'border border-[var(--color-hairline-strong)] focus:border-2 focus:border-[var(--color-primary)] focus:shadow-[var(--elevation-focus-ring)]',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
