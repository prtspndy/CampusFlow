import React from 'react'
import { cn } from '../../lib/cn'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'on-dark'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium font-body transition-colors focus-visible:outline-none cursor-pointer disabled:pointer-events-none select-none'

    // Radii & dimensions strictly according to DESIGN.md
    // rounded: 10px (radius-md), height: 44px for default
    const sizeStyles = {
      sm: 'h-9 px-3 text-caption font-medium rounded-[10px]',
      md: 'h-11 px-5 text-button rounded-[10px]',
      lg: 'h-12 px-6 text-body-md-medium rounded-[10px]',
    }

    const variantStyles = {
      primary:
        'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-pressed)] active:bg-[var(--color-primary-pressed)] disabled:bg-[var(--color-hairline)] disabled:text-[var(--color-muted)]',
      secondary:
        'bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] disabled:opacity-50',
      ghost:
        'bg-transparent text-[var(--color-primary-deep)] hover:bg-[var(--color-primary-tint)] active:bg-[var(--color-primary-tint)] disabled:opacity-50',
      danger:
        'bg-[var(--color-error)] text-[var(--color-on-primary)] hover:opacity-90 active:opacity-100 disabled:opacity-50',
      'on-dark':
        'bg-[var(--color-on-dark)] text-[var(--color-brand-navy)] hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          baseStyles,
          'relative',
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* Keep the label in the layout so the button does not change width while loading. */}
        <span className={cn('inline-flex items-center gap-2', isLoading && 'invisible')}>
          {children}
        </span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
