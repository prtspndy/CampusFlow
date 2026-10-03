import React from 'react'
import { ThemeProvider, AuthProvider, NotificationProvider } from '@/context'
import { AppRoutes } from '@/routes'

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
