import React from 'react'
import { Card, Badge, Button } from '@/components/common'
import type { CampusEvent } from '../types/event.types'
import { formatDateTime } from '@/utils/formatters'

export const EventCard: React.FC<{ event: CampusEvent; onRSVP?: (id: string) => void }> = ({
  event,
  onRSVP,
}) => {
  const isFull = event.rsvpCount >= event.capacity

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            {event.clubName}
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.15rem' }}>{event.title}</h3>
        </div>
        <Badge variant={event.status === 'published' ? 'success' : 'warning'}>
          {event.status}
        </Badge>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{event.description}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <div>📍 {event.venue}</div>
        <div>🕒 {formatDateTime(event.startTime)}</div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: isFull ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
          🎟️ {event.rsvpCount} / {event.capacity} spots filled
        </span>
        {onRSVP && (
          <Button
            size="sm"
            variant={isFull ? 'secondary' : 'primary'}
            disabled={isFull || !event.isRegistrationOpen}
            onClick={() => onRSVP(event.id)}
          >
            {isFull ? 'Sold Out' : 'RSVP Now'}
          </Button>
        )}
      </div>
    </Card>
  )
}
