import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

export const CheckinLayout: React.FC = () => {
  useEffect(() => {
    // Door checkin opens in dark mode regardless of user setting per DESIGN.md
    const originalTheme = document.documentElement.getAttribute('data-theme')
    const originalHasDark = document.documentElement.classList.contains('dark')

    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.classList.add('dark')

    return () => {
      if (originalTheme) {
        document.documentElement.setAttribute('data-theme', originalTheme)
      }
      if (!originalHasDark) {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-[var(--color-canvas)] text-[var(--color-ink)] flex flex-col">
      <Outlet />
    </div>
  )
}
