import React from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { formatRole, type UserRole } from '../../lib/constants'
import { hasAllPermissions, hasAnyPermission } from '../../lib/permissions'
import { Button } from '../ui/Button'
import { TopBar } from './TopBar'

interface RequireAuthProps {
  /** When provided, only these roles may enter. Anyone signed in is allowed otherwise. */
  roles?: UserRole[]
  /** When provided, user must possess all of these permissions. */
  permissions?: string[]
  /** When provided, user must possess at least one of these permissions. */
  anyPermission?: string[]
}

/**
 * Route-level guard. The backend enforces authorization on every request;
 * this keeps users out of screens they cannot access.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  roles,
  permissions,
  anyPermission,
}) => {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
        <TopBar />
        <div
          aria-busy="true"
          aria-live="polite"
          className="flex-1 w-full max-w-[640px] mx-auto px-4 py-10 space-y-4"
        >
          <span className="sr-only">Checking your session</span>
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-28" />
          <div className="skeleton h-56" />
        </div>
      </div>
    )
  }

  if (status === 'anonymous' || !user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  const roleForbidden = roles && !roles.includes(user.role)
  const permissionsForbidden = permissions && !hasAllPermissions(user, permissions)
  const anyPermissionForbidden = anyPermission && !hasAnyPermission(user, anyPermission)

  if (roleForbidden || permissionsForbidden || anyPermissionForbidden) {
    const roleLabel = user.roleDisplayName ?? formatRole(user.role)
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
        <TopBar />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-warning-tint)] text-[var(--color-warning-deep)]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
              Access Restricted
            </h1>
            <p className="mt-2 text-body-sm text-[var(--color-muted)]">
              You are signed in as <span className="font-semibold text-[var(--color-ink)]">{roleLabel}</span>.
              Your account does not have sufficient permissions to view this section.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/member">
                <Button variant="primary">Go to Member App</Button>
              </Link>
              <Link to="/">
                <Button variant="secondary">Back to Home</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return <Outlet />
}
