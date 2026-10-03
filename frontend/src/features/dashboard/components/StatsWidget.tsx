import React from 'react'
import { Card } from '@/components/common'
import type { DashboardStats } from '../types/dashboard.types'

export const StatsWidget: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const statCards = [
    { label: 'Active Clubs', value: stats.activeClubsCount, icon: '🏛️', color: 'var(--color-primary)' },
    { label: 'Upcoming Events', value: stats.upcomingEventsCount, icon: '📅', color: 'var(--color-secondary)' },
    { label: 'Pending Approvals', value: stats.pendingApprovalsCount, icon: '⏳', color: 'var(--color-warning)' },
    { label: 'Active Members', value: stats.activeMembersCount, icon: '👥', color: 'var(--color-accent)' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {statCards.map((card, idx) => (
        <Card key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div
            style={{
              fontSize: '1.75rem',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-page)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {card.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {card.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.15rem' }}>
              {card.value}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
