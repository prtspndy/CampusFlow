import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { ROLES, type UserRole } from '../../lib/constants'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/Button'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  // Wait for session hydration if underway
  if (!isInitialized && typeof window !== 'undefined') {
    // If we have a stored token/demo user, proceed; otherwise render minimal spinner
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[var(--color-primary-tint)] border-t-[var(--color-primary)] animate-spin" />
            <p className="text-body-sm text-[var(--color-muted)]">Verifying session...</p>
          </div>
        </div>
      )
    }
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[var(--color-surface)]">
        <div className="max-w-md w-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[20px] p-8 shadow-[var(--elevation-2)] text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-title-md font-bold text-[var(--color-ink)] mb-2">
            Restricted Access
          </h2>
          <p className="font-body text-body-md text-[var(--color-muted)] mb-6 leading-relaxed">
            This module requires <span className="font-semibold text-[var(--color-ink)]">{allowedRoles.map(r => r.toLowerCase()).join(' or ')}</span> permissions. Your current account role is <span className="font-semibold text-[var(--color-ink)]">{user.role.toLowerCase()}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="secondary" size="md" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Campus
              </Button>
            </Link>
            {user.role === ROLES.MEMBER && (
              <Link to="/member">
                <Button variant="primary" size="md" className="w-full sm:w-auto">
                  Go to Member Pass
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
