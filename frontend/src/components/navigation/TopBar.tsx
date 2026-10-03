import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sun,
  Moon,
  Laptop,
  ChevronDown,
  ShoppingBag,
  LogOut,
  CreditCard,
  LayoutDashboard,
  QrCode,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore, type ThemePreference } from '../../stores/themeStore'
import { useCartStore } from '../../stores/cartStore'
import {
  APP_NAME,
  ORG_NAME,
  ADMIN_CONSOLE_ROLES,
  CHECKIN_ROLES,
  formatRole,
} from '../../lib/constants'
import { DropdownMenu, type DropdownMenuItem } from '../ui/DropdownMenu'

const THEME_OPTIONS: Array<{
  id: ThemePreference
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'system', label: 'System', icon: Laptop },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const TopBar: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const logout = useAuthStore((state) => state.logout)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const cartCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  )
  const toggleCart = useCartStore((state) => state.toggleOpen)
  const navigate = useNavigate()

  const ThemeIcon = THEME_OPTIONS.find((option) => option.id === theme)?.icon ?? Laptop

  const accountItems: DropdownMenuItem[] = user
    ? [
        {
          id: 'member',
          label: 'Member app',
          icon: CreditCard,
          onSelect: () => navigate('/member'),
        },
        ...(ADMIN_CONSOLE_ROLES.includes(user.role)
          ? [
              {
                id: 'admin',
                label: 'Admin console',
                icon: LayoutDashboard,
                onSelect: () => navigate('/admin'),
              },
            ]
          : []),
        ...(CHECKIN_ROLES.includes(user.role)
          ? [
              {
                id: 'checkin',
                label: 'Door check-in',
                icon: QrCode,
                onSelect: () => navigate('/checkin/event-gala-1'),
              },
            ]
          : []),
        {
          id: 'logout',
          label: 'Sign out',
          icon: LogOut,
          tone: 'danger',
          onSelect: () => {
            void logout().then(() => navigate('/'))
          },
        },
      ]
    : []

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[var(--color-canvas)]/95 backdrop-blur-md border-b border-[var(--color-hairline)] px-4 md:px-8 flex items-center justify-between">
      <Link
        to="/"
        className="flex items-center gap-2.5 select-none rounded-[10px]"
        aria-label={`${APP_NAME} home`}
      >
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-[10px] bg-[var(--color-primary)] flex items-center justify-center text-white font-display font-extrabold text-lg shadow-sm"
        >
          CF
        </div>
        <div>
          <span className="font-display font-extrabold text-heading-3 text-[var(--color-ink)] tracking-tight block leading-none">
            {APP_NAME}
          </span>
          <span className="text-[11px] text-[var(--color-muted)] font-medium hidden sm:block">
            {ORG_NAME}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={toggleCart}
          className="relative p-2 rounded-[10px] text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
          aria-label={cartCount > 0 ? `Open cart, ${cartCount} items` : 'Open cart'}
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-bold flex items-center justify-center"
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        <DropdownMenu
          triggerLabel="Theme"
          widthClassName="w-36"
          triggerClassName="p-2 rounded-[10px] text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
          trigger={<ThemeIcon className="w-5 h-5" />}
          items={THEME_OPTIONS.map((option) => ({
            id: option.id,
            label: option.label,
            icon: option.icon,
            selected: theme === option.id,
            onSelect: () => setTheme(option.id),
          }))}
        />

        <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-[var(--color-hairline)]">
          {user ? (
            <DropdownMenu
              triggerLabel={`Account menu for ${user.name}`}
              heading={`${user.name} · ${formatRole(user.role)}`}
              widthClassName="w-56"
              triggerClassName="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
              trigger={
                <>
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-full bg-[var(--color-tint-sky)] text-[var(--color-tint-sky-deep)] flex items-center justify-center font-bold text-caption"
                  >
                    {initials(user.name)}
                  </span>
                  <ChevronDown
                    className="w-3.5 h-3.5 text-[var(--color-muted)]"
                    aria-hidden="true"
                  />
                </>
              }
              items={accountItems}
            />
          ) : status === 'checking' ? (
            <span aria-hidden="true" className="skeleton w-8 h-8 rounded-full" />
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 rounded-[10px] text-body-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/join"
                className="hidden sm:inline-flex h-9 items-center px-3.5 rounded-[10px] bg-[var(--color-primary)] text-[var(--color-on-primary)] text-body-sm font-semibold hover:bg-[var(--color-primary-pressed)] transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
