import React from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from '../navigation/TopBar'
import { AdminSidebar } from '../navigation/AdminSidebar'
import { CartSheet } from '../shop/CartSheet'

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-body)]">
      <TopBar />
      <CartSheet />

      <div className="flex-1 flex flex-row w-full">
        <AdminSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 max-w-[1280px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
