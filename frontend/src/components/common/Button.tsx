import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--color-primary-gradient)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
        }
      case 'secondary':
        return {
          background: 'var(--bg-surface-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--color-primary)',
          border: '1.5px solid var(--color-primary)',
        }
      case 'danger':
        return {
          background: 'var(--color-danger)',
          color: '#ffffff',
        }
    }
  }

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '0.4rem 0.85rem', fontSize: '0.85rem' }
      case 'lg':
        return { padding: '0.85rem 1.75rem', fontSize: '1.05rem' }
      case 'md':
      default:
        return { padding: '0.65rem 1.25rem', fontSize: '0.95rem' }
    }
  }

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    opacity: disabled || isLoading ? 0.6 : 1,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  }

  return (
    <button
      disabled={disabled || isLoading}
      style={baseStyles}
      className={className}
      {...props}
    >
      {isLoading ? <span>Loading...</span> : children}
    </button>
  )
}
