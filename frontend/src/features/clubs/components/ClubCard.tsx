import React from 'react'
import { Card, Badge, Button } from '@/components/common'
import type { Club } from '../types/club.types'
import { formatCurrency } from '@/utils/formatters'

export const ClubCard: React.FC<{ club: Club; onSelect?: (club: Club) => void }> = ({
  club,
  onSelect,
}) => {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{club.name}</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lead: {club.leadName}</span>
        </div>
        <Badge variant="primary">{club.category}</Badge>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, lineClamp: 2 }}>
        {club.description}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          👥 {club.memberCount} Members
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)' }}>
          {formatCurrency(club.budgetAllocated)} Budget
        </span>
      </div>

      {onSelect && (
        <Button variant="secondary" size="sm" onClick={() => onSelect(club)}>
          View Club Workspace
        </Button>
      )}
    </Card>
  )
}
