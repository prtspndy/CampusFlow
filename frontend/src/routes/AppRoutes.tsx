import React, { useState, useEffect } from 'react'
import {
  DashboardPage,
  ClubsPage,
  EventsPage,
  BudgetPage,
  LoginPage,
  NotFoundPage,
} from '@/pages'
import { ROUTES } from './routePaths'

export const AppRoutes: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  switch (currentPath) {
    case ROUTES.HOME:
      return <DashboardPage />
    case ROUTES.CLUBS:
      return <ClubsPage />
    case ROUTES.EVENTS:
      return <EventsPage />
    case ROUTES.BUDGET:
      return <BudgetPage />
    case ROUTES.LOGIN:
      return <LoginPage />
    default:
      return <NotFoundPage />
  }
}
