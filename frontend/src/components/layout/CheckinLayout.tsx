import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { PageBoundary } from '../feedback/PageBoundary'

export const CheckinLayout: React.FC = () => {
  useEffect(() => {
    // Door check-in opens in dark mode regardless of user setting per DESIGN.md
    const root = document.documentElement
    const originalTheme = root.getAttribute('data-theme')
    const originalHasDark = root.classList.contains('dark')

    root.setAttribute('data-theme', 'dark')
    root.classList.add('dark')

    return () => {
      if (originalTheme) {
        root.setAttribute('data-theme', originalTheme)
      }
      if (!originalHasDark) {
        root.classList.remove('dark')
      }
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-[var(--color-canvas)] text-[var(--color-ink)] flex flex-col">
      <PageBoundary>
        <Outlet />
      </PageBoundary>
    </div>
  )
}
