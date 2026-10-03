import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { TopBar } from '../navigation/TopBar'
import { CartSheet } from '../shop/CartSheet'
import { SkipLink, MAIN_CONTENT_ID } from '../navigation/SkipLink'
import { PageBoundary } from '../feedback/PageBoundary'
import { APP_NAME, ORG_NAME } from '../../lib/constants'

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-body)]">
      <SkipLink />
      <TopBar />
      <CartSheet />

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 outline-none"
      >
        <PageBoundary>
          <Outlet />
        </PageBoundary>
      </main>

      <footer className="mt-auto border-t border-[var(--color-hairline)] bg-[var(--color-surface)] py-8 px-4 sm:px-8 text-caption text-[var(--color-muted)]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[var(--color-ink)]">{APP_NAME}</span>
            <span aria-hidden="true">•</span>
            <span>{ORG_NAME}</span>
          </div>

          <nav aria-label="Footer" className="flex items-center gap-6">
            <Link to="/events" className="hover:text-[var(--color-ink)] transition-colors">
              Events
            </Link>
            <Link to="/volunteers" className="hover:text-[var(--color-ink)] transition-colors">
              Volunteers
            </Link>
            <Link to="/fundraisers" className="hover:text-[var(--color-ink)] transition-colors">
              Fundraisers
            </Link>
            <Link to="/shop" className="hover:text-[var(--color-ink)] transition-colors">
              Merchandise
            </Link>
            <Link
              to="/join"
              className="hover:text-[var(--color-ink)] transition-colors font-medium text-[var(--color-primary)]"
            >
              Join Club
            </Link>
            <Link to="/admin" className="hover:text-[var(--color-ink)] transition-colors">
              Admin Portal
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
