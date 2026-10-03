import React, { Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'

/** Shown while a lazily loaded page downloads. Keeps the layout shell in place. */
export const PageSkeleton: React.FC = () => (
  <div aria-busy="true" aria-live="polite" className="space-y-6 animate-in fade-in duration-150">
    <span className="sr-only">Loading page</span>
    <div className="space-y-3">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton h-9 w-2/3 max-w-md" />
      <div className="skeleton h-4 w-1/2 max-w-sm" />
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="skeleton h-56" />
      <div className="skeleton hidden h-56 md:block" />
      <div className="skeleton hidden h-56 lg:block" />
    </div>
  </div>
)

/**
 * Wraps each layout's <Outlet /> so page code loads and fails inside the shell
 * instead of replacing the whole screen.
 */
export const PageBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  )
}
