import React from 'react'
import { MainLayout } from '@/components/layout'
import { ClubCard } from '@/features/clubs'
import { Button } from '@/components/common'
import type { Club } from '@/features/clubs'

export const ClubsPage: React.FC = () => {
  const sampleClubs: Club[] = [
    {
      id: 'c1',
      name: 'Google Developer Student Club',
      category: 'Tech',
      description: 'Building innovative projects with cloud, machine learning, and modern web tech.',
      memberCount: 230,
      leadName: 'Alex Rivera',
      budgetAllocated: 3200,
    },
    {
      id: 'c2',
      name: 'Robotics & Automation Society',
      category: 'Tech',
      description: 'Designing autonomous mobile robots, microcontrollers, and competitive robotics.',
      memberCount: 95,
      leadName: 'Devin Patel',
      budgetAllocated: 4800,
    },
    {
      id: 'c3',
      name: 'Campus Symphony Orchestra',
      category: 'Cultural',
      description: 'Orchestrating seasonal symphonies, student concerts, and cross-genre showcases.',
      memberCount: 75,
      leadName: 'Elena Rostova',
      budgetAllocated: 2900,
    },
    {
      id: 'c4',
      name: 'Consulting & FinTech Club',
      category: 'Academic',
      description: 'Case competitions, market analysis research, and corporate mentorship pipelines.',
      memberCount: 160,
      leadName: 'Marcus Chen',
      budgetAllocated: 2100,
    },
  ]

  return (
    <MainLayout activePath="/clubs">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Student Organizations</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Explore, join, or administer student organizations and university societies.
            </p>
          </div>
          <Button variant="primary">+ Register New Club</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {sampleClubs.map(club => (
            <ClubCard key={club.id} club={club} onSelect={c => alert(`Opening ${c.name}`)} />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
