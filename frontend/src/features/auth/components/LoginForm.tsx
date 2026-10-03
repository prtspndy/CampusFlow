import React, { useState } from 'react'
import { Card, Input, Button } from '@/components/common'
import { useAuthContext } from '@/context/AuthContext'
import type { Role } from '@/types'

export const LoginForm: React.FC = () => {
  const { login } = useAuthContext()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulated authentication for hackathon rapid development
    setTimeout(() => {
      login('mock-jwt-token-campusflow', {
        id: 'usr_1',
        name: email.split('@')[0] || 'Campus User',
        email,
        role,
        joinedAt: new Date().toISOString(),
      })
      setLoading(false)
    }, 600)
  }

  return (
    <Card style={{ maxWidth: '440px', width: '100%', margin: '2rem auto' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Access your student organization workspace
          </p>
        </div>

        <Input
          label="Campus Email"
          type="email"
          placeholder="student@university.edu"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Role
          </label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-strong)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="student">Student</option>
            <option value="club_lead">Club Leader</option>
            <option value="faculty_advisor">Faculty Advisor</option>
            <option value="admin">Campus Administrator</option>
          </select>
        </div>

        <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
          Sign In to CampusFlow
        </Button>
      </form>
    </Card>
  )
}
