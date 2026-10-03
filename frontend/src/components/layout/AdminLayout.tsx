import React from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from '../navigation/TopBar'
import { AdminSidebar, AdminMobileNav } from '../navigation/AdminSidebar'
import { CartSheet } from '../shop/CartSheet'
import { SkipLink, MAIN_CONTENT_ID } from '../navigation/SkipLink'
import { PageBoundary } from '../feedback/PageBoundary'

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-body)]">
      <SkipLink />
      <TopBar />
      <CartSheet />
      <AdminMobileNav />

      <div className="flex-1 flex flex-row w-full">
        <AdminSidebar />

        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex-1 min-w-0 px-4 sm:px-8 py-6 md:py-8 max-w-[1280px] outline-none"
        >
          <PageBoundary>
            <Outlet />
          </PageBoundary>
        </main>
      </div>
    </div>
  )
}
