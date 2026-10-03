import React from 'react'

export interface NavItem {
  id: string
  label: string
  icon: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
  { id: 'clubs', label: 'Clubs & Orgs', icon: '🏛️', path: '/clubs' },
  { id: 'events', label: 'Events & RSVP', icon: '📅', path: '/events' },
  { id: 'budget', label: 'Budget & Finance', icon: '💰', path: '/budget' },
  { id: 'approvals', label: 'Approvals', icon: '✅', path: '/approvals' },
]

export const Sidebar: React.FC<{ activePath?: string }> = ({ activePath = '/' }) => {
  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        gap: '0.5rem',
      }}
    >
      <div style={{ padding: '0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Menu
      </div>
      {NAV_ITEMS.map(item => {
        const isActive = activePath === item.path
        return (
          <a
            key={item.id}
            href={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.925rem',
              fontWeight: 600,
              backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              transition: 'background var(--transition-fast)',
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        )
      })}
    </aside>
  )
}
