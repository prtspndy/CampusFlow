import React from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from '../navigation/TopBar'
import { BottomTabBar } from '../navigation/BottomTabBar'
import { CartSheet } from '../shop/CartSheet'

export const MemberLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-body)]">
      <TopBar />
      <CartSheet />

      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}
