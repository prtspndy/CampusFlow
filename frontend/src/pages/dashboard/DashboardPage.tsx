import React from 'react'
import { MainLayout } from '@/components/layout'
import { StatsWidget, ActivityFeed } from '@/features/dashboard'
import { ClubCard } from '@/features/clubs'
import { EventCard } from '@/features/events'
import { Button } from '@/components/common'

export const DashboardPage: React.FC = () => {
  const mockStats = {
    activeClubsCount: 24,
    upcomingEventsCount: 8,
    pendingApprovalsCount: 5,
    activeMembersCount: 1420,
  }

  const mockActivities = [
    {
      id: '1',
      title: 'Robotics Club submitted budget request',
      description: '$450 for Autonomous Drone components',
      timestamp: '15m ago',
      type: 'budget' as const,
    },
    {
      id: '2',
      title: 'Hackathon 2026 venue reserved',
      description: 'Main Auditorium approved by Dean of Students',
      timestamp: '2h ago',
      type: 'approval' as const,
    },
    {
      id: '3',
      title: 'Design Guild added 18 new members',
      description: 'Fall recruitment batch concluded',
      timestamp: '5h ago',
      type: 'member' as const,
    },
  ]

  const sampleClub = {
    id: 'c1',
    name: 'Google Developer Student Club',
    category: 'Tech' as const,
    description: 'Empowering students to build community and grow knowledge with developer technologies.',
    memberCount: 230,
    leadName: 'Alex Rivera',
    budgetAllocated: 3200,
  }

  const sampleEvent = {
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
    status: 'published' as const,
    isRegistrationOpen: true,
  }

  return (
    <MainLayout activePath="/">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
              Campus Overview
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Welcome back! Here is what is happening across your student organizations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" size="md">
              Download Report
            </Button>
            <Button variant="primary" size="md">
              + New Event / Request
            </Button>
          </div>
        </div>

        <StatsWidget stats={mockStats} />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Featured Organization</h2>
                <a href="/clubs" style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                  View All Clubs →
                </a>
              </div>
              <ClubCard club={sampleClub} onSelect={() => {}} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Next Upcoming Event</h2>
                <a href="/events" style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                  Browse All Events →
                </a>
              </div>
              <EventCard event={sampleEvent} onRSVP={() => alert('RSVP successful!')} />
            </div>
          </div>

          <div>
            <ActivityFeed activities={mockActivities} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
