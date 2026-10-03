import React from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from '../navigation/TopBar'
import { BottomTabBar } from '../navigation/BottomTabBar'
import { CartSheet } from '../shop/CartSheet'
import { SkipLink, MAIN_CONTENT_ID } from '../navigation/SkipLink'
import { PageBoundary } from '../feedback/PageBoundary'

export const MemberLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-body)]">
      <SkipLink />
      <TopBar />
      <CartSheet />

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex-1 w-full max-w-[640px] mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 outline-none"
      >
        <PageBoundary>
          <Outlet />
        </PageBoundary>
      </main>

      <BottomTabBar />
    </div>
  )
}
