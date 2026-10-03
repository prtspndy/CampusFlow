import React from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { useThemeContext } from '@/context/ThemeContext'
import { Button } from '@/components/common'

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthContext()
  const { theme, toggleTheme } = useThemeContext()

  return (
    <header
      style={{
        height: '68px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'var(--backdrop-blur)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--color-primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}
        >
          CF
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Campus<span className="text-gradient">Flow</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={toggleTheme}
          style={{
            padding: '0.5rem 0.8rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {user.name} ({user.role})
            </span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
