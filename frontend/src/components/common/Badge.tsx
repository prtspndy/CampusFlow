import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1' }
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' }
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' }
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' }
      case 'neutral':
      default:
        return { bg: 'var(--border-subtle)', text: 'var(--text-secondary)' }
    }
  }

  const { bg, text } = getColors()

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: bg,
        color: text,
      }}
    >
      {children}
    </span>
  )
}
