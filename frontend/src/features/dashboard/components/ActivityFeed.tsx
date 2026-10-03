import React from 'react'
import { Card } from '@/components/common'
import type { ActivityItem } from '../types/dashboard.types'

export const ActivityFeed: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Live Campus Feed</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {activities.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>📌</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.description}</div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.timestamp}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
