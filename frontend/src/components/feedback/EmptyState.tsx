import React from 'react'
import { Card } from '@/components/common'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = '📭',
}) => {
  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        gap: '0.75rem',
      }}
    >
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
    </Card>
  )
}
