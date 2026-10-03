import React from 'react'
import { MainLayout } from '@/components/layout'
import { EventCard } from '@/features/events'
import { Button } from '@/components/common'
import type { CampusEvent } from '@/features/events'

export const EventsPage: React.FC = () => {
  const sampleEvents: CampusEvent[] = [
    {
      id: 'e1',
      clubId: 'c1',
      clubName: 'Google Developer Student Club',
      title: 'Generative AI & Cloud Hack Night',
      description: 'Hands-on building session with Gemini APIs and Cloud Run deployment workshop.',
      venue: 'CS Building Lab 402',
      startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 2 + 10800000).toISOString(),
      capacity: 60,
      rsvpCount: 48,
      status: 'published',
      isRegistrationOpen: true,
    },
    {
      id: 'e2',
      clubId: 'c2',
      clubName: 'Robotics & Automation Society',
      title: 'Annual Sumo-Bot Showdown',
      description: 'Battle of student-built autonomous mini-robots on the arena.',
      venue: 'Student Union Atrium',
      startTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 5 + 14400000).toISOString(),
      capacity: 120,
      rsvpCount: 115,
      status: 'published',
      isRegistrationOpen: true,
    },
  ]

  return (
    <MainLayout activePath="/events">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Campus Events</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Discover upcoming club workshops, guest lectures, and campus competitions.
            </p>
          </div>
          <Button variant="primary">+ Create Event</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {sampleEvents.map(event => (
            <EventCard key={event.id} event={event} onRSVP={id => alert(`RSVP recorded for event: ${id}`)} />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
