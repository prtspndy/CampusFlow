import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  style,
  className = '',
  ...props
}) => {
  const cardStyle: React.CSSProperties = {
    background: glass ? 'var(--bg-glass)' : 'var(--bg-surface)',
    backdropFilter: glass ? 'var(--backdrop-blur)' : undefined,
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: '1.5rem',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
    ...style,
  }

  return (
    <div style={cardStyle} className={className} {...props}>
      {children}
    </div>
  )
}
