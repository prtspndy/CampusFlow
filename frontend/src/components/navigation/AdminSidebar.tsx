import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Megaphone,
  ShoppingBag,
  CheckSquare,
  Landmark,
  QrCode,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../lib/constants'
import { ROLES } from '../../lib/constants'
import { cn } from '../../lib/cn'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  end?: boolean
  tintColor?: string
  roles: UserRole[]
}

export const AdminSidebar: React.FC = () => {
  const { user } = useAuthStore()
  const role = user?.role || ROLES.MEMBER

  // Module items with tint indicator colors
  const navItems: NavItem[] = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
      roles: [ROLES.ADMIN, ROLES.TREASURER, ROLES.VOLUNTEER],
    },
    {
      to: '/admin/members',
      label: 'Members',
      icon: Users,
      tintColor: 'var(--color-tint-sky-deep)',
      roles: [ROLES.ADMIN],
    },
    {
      to: '/admin/events',
      label: 'Events & Tickets',
      icon: Calendar,
      tintColor: 'var(--color-tint-peach-deep)',
      roles: [ROLES.ADMIN, ROLES.VOLUNTEER],
    },
    {
      to: '/checkin/event-gala-1',
      label: 'Door Check-in',
      icon: QrCode,
      tintColor: 'var(--color-sunset)',
      roles: [ROLES.ADMIN, ROLES.DOOR_STAFF, ROLES.VOLUNTEER],
    },
    {
      to: '/admin/announcements',
      label: 'Announcements',
      icon: Megaphone,
      tintColor: 'var(--color-tint-lavender-deep)',
      roles: [ROLES.ADMIN],
    },
    {
      to: '/admin/shop',
      label: 'Shop & Stock',
      icon: ShoppingBag,
      tintColor: 'var(--color-tint-mint-deep)',
      roles: [ROLES.ADMIN],
    },
    {
      to: '/admin/fundraisers',
      label: 'Tasks & Fundraisers',
      icon: CheckSquare,
      tintColor: 'var(--color-tint-butter-deep)',
      roles: [ROLES.ADMIN, ROLES.VOLUNTEER],
    },
    {
      to: '/admin/treasury',
      label: 'Treasury & Finance',
      icon: Landmark,
      tintColor: 'var(--color-tint-sage-deep)',
      roles: [ROLES.ADMIN, ROLES.TREASURER],
    },
  ]

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside
      className="hidden md:flex flex-col w-[248px] shrink-0 min-h-[calc(100vh-4rem)] bg-[var(--color-surface)] border-r border-[var(--color-hairline)] p-4 select-none"
    >
      <div className="mb-4 px-3 py-2 text-micro-uppercase text-[var(--color-muted)] font-bold">
        Club Management
      </div>

      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-body-sm font-medium transition-all group cursor-pointer',
                isActive
                  ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] font-semibold'
                  : 'text-[var(--color-body)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* 3px vertical pill indicator on left edge when active per DESIGN.md */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[var(--color-primary)]" />
                )}

                <item.icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
                  )}
                  style={!isActive && item.tintColor ? { color: item.tintColor } : undefined}
                />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quick link to Member App */}
      <div className="mt-auto pt-4 border-t border-[var(--color-hairline)]">
        <NavLink
          to="/member"
          className="flex items-center justify-between px-3 py-2 rounded-[10px] text-caption font-semibold bg-[var(--color-canvas)] text-[var(--color-primary-deep)] border border-[var(--color-hairline)] hover:bg-[var(--color-surface)]"
        >
          <span>Open Member App</span>
          <span>→</span>
        </NavLink>
      </div>
    </aside>
  )
}
