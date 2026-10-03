import React from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export const MainLayout: React.FC<{ children: React.ReactNode; activePath?: string }> = ({
  children,
  activePath,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activePath={activePath} />
        <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--bg-page)', overflowY: 'auto' }}>
          <div className="app-container">{children}</div>
        </main>
      </div>
    </div>
  )
}
