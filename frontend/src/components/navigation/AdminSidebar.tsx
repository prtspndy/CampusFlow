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
  ShieldCheck,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../lib/constants'
import { ROLES, formatRole } from '../../lib/constants'
import { cn } from '../../lib/cn'

interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  end?: boolean
  tintColor?: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/admin',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
    roles: [ROLES.ADMIN, ROLES.TREASURER, ROLES.EVENT_MANAGER],
  },
  {
    to: '/admin/users',
    label: 'Users & Roles',
    shortLabel: 'Users',
    icon: ShieldCheck,
    tintColor: 'var(--color-primary)',
    roles: [ROLES.ADMIN],
  },
  {
    to: '/admin/members',
    label: 'Members',
    shortLabel: 'Members',
    icon: Users,
    tintColor: 'var(--color-tint-sky-deep)',
    roles: [ROLES.ADMIN, ROLES.TREASURER],
  },
  {
    to: '/admin/events',
    label: 'Events & Tickets',
    shortLabel: 'Events',
    icon: Calendar,
    tintColor: 'var(--color-tint-peach-deep)',
    roles: [ROLES.ADMIN, ROLES.EVENT_MANAGER],
  },
  {
    to: '/checkin/event-gala-1',
    label: 'Door Check-in',
    shortLabel: 'Check-in',
    icon: QrCode,
    tintColor: 'var(--color-sunset)',
    roles: [ROLES.ADMIN, ROLES.EVENT_MANAGER],
  },
  {
    to: '/admin/announcements',
    label: 'Announcements',
    shortLabel: 'Announce',
    icon: Megaphone,
    tintColor: 'var(--color-tint-lavender-deep)',
    roles: [ROLES.ADMIN, ROLES.EVENT_MANAGER],
  },
  {
    to: '/admin/shop',
    label: 'Shop & Stock',
    shortLabel: 'Shop',
    icon: ShoppingBag,
    tintColor: 'var(--color-tint-mint-deep)',
    roles: [ROLES.ADMIN, ROLES.TREASURER],
  },
  {
    to: '/admin/fundraisers',
    label: 'Tasks & Fundraisers',
    shortLabel: 'Tasks',
    icon: CheckSquare,
    tintColor: 'var(--color-tint-butter-deep)',
    roles: [ROLES.ADMIN, ROLES.EVENT_MANAGER, ROLES.TREASURER],
  },
  {
    to: '/admin/treasury',
    label: 'Treasury & Finance',
    shortLabel: 'Treasury',
    icon: Landmark,
    tintColor: 'var(--color-tint-sage-deep)',
    roles: [ROLES.ADMIN, ROLES.TREASURER],
  },
]

function useVisibleNavItems(): NavItem[] {
  const role = useAuthStore((state) => state.user?.role ?? ROLES.MEMBER)
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export const AdminSidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const visibleItems = useVisibleNavItems()

  return (
    <aside className="hidden md:flex flex-col w-[248px] shrink-0 min-h-[calc(100vh-4rem)] bg-[var(--color-surface)] border-r border-[var(--color-hairline)] p-4 select-none">
      <div className="mb-4 px-3 py-2">
        <div className="text-micro-uppercase text-[var(--color-muted)] font-bold">
          Club Management
        </div>
        {user && (
          <div className="mt-1 text-caption text-[var(--color-primary-deep)] font-semibold truncate">
            {user.roleDisplayName ?? formatRole(user.role)}
          </div>
        )}
      </div>

      <nav aria-label="Admin sections" className="flex flex-col gap-1">
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
                  : 'text-[var(--color-body)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]',
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
                    isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]',
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
          <span aria-hidden="true">→</span>
        </NavLink>
      </div>
    </aside>
  )
}

/** Horizontal section switcher for phones and small tablets, where the sidebar is hidden. */
export const AdminMobileNav: React.FC = () => {
  const visibleItems = useVisibleNavItems()

  if (visibleItems.length === 0) return null

  return (
    <nav
      aria-label="Admin sections"
      className="md:hidden sticky top-16 z-30 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]/95 backdrop-blur-md"
    >
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center gap-1.5 h-9 px-3 rounded-full text-caption-bold whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)]'
                  : 'bg-[var(--color-canvas)] text-[var(--color-body)] border border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface-sunken)]',
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
