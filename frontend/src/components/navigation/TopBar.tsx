import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, Laptop, ChevronDown, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore, type ThemePreference } from '../../stores/themeStore'
import { useCartStore } from '../../stores/cartStore'
import { ROLES, APP_NAME, ORG_NAME, type UserRole } from '../../lib/constants'
import { DropdownMenu } from '../ui/DropdownMenu'

const THEME_OPTIONS: Array<{
  id: ThemePreference
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'system', label: 'System', icon: Laptop },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

const ROLE_HOME: Record<UserRole, string> = {
  [ROLES.MEMBER]: '/member',
  [ROLES.VOLUNTEER]: '/admin',
  [ROLES.DOOR_STAFF]: '/checkin/event-gala-1',
  [ROLES.TREASURER]: '/admin',
  [ROLES.ADMIN]: '/admin',
}

function formatRole(role: UserRole): string {
  return role.toLowerCase().replace('_', ' ')
}

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
  const switchRole = useAuthStore((state) => state.switchRole)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const cartCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  )
  const toggleCart = useCartStore((state) => state.toggleOpen)
  const navigate = useNavigate()

  const ThemeIcon = THEME_OPTIONS.find((option) => option.id === theme)?.icon ?? Laptop

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

        {/* Demo role switcher. Backend authorization decides what each role can really do. */}
        <DropdownMenu
          triggerLabel="Switch demo role"
          heading="Switch Active Role"
          triggerClassName="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-caption font-semibold bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink)] border border-[var(--color-hairline)] transition-colors cursor-pointer"
          trigger={
            <>
              <span className="text-[var(--color-muted)] font-normal hidden sm:inline">Role:</span>
              <span className="capitalize">{user ? formatRole(user.role) : 'Guest'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted)]" aria-hidden="true" />
            </>
          }
          items={Object.values(ROLES).map((role) => ({
            id: role,
            label: formatRole(role),
            selected: user?.role === role,
            onSelect: () => {
              switchRole(role)
              navigate(ROLE_HOME[role])
            },
          }))}
        />

        <DropdownMenu
          triggerLabel="Theme"
          align="right"
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

        <div className="flex items-center gap-2 pl-1 border-l border-[var(--color-hairline)]">
          <div
            aria-label={user ? `Signed in as ${user.name}` : 'Guest'}
            role="img"
            className="w-8 h-8 rounded-full bg-[var(--color-tint-sky)] text-[var(--color-tint-sky-deep)] flex items-center justify-center font-bold text-caption"
          >
            {user?.name ? initials(user.name) : 'G'}
          </div>
        </div>
      </div>
    </header>
  )
}
