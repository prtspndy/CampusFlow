import React from 'react'
import { LoginForm } from '@/features/auth'
import { Navbar } from '@/components/layout'

export const LoginPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <LoginForm />
      </div>
    </div>
  )
}
