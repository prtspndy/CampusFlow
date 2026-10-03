import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sun,
  Moon,
  Laptop,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore, type ThemePreference } from '../../stores/themeStore'
import { useCartStore } from '../../stores/cartStore'
import { ROLES, APP_NAME } from '../../lib/constants'

export const TopBar: React.FC = () => {
  const { user, switchRole } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const { totalItems, toggleOpen } = useCartStore()
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const navigate = useNavigate()

  const cartCount = totalItems()

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[var(--color-canvas)]/95 backdrop-blur-md border-b border-[var(--color-hairline)] px-4 md:px-8 flex items-center justify-between">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          <div className="w-8 h-8 rounded-[10px] bg-[var(--color-primary)] flex items-center justify-center text-white font-display font-extrabold text-lg shadow-sm">
            CF
          </div>
          <div>
            <span className="font-display font-extrabold text-heading-3 text-[var(--color-ink)] tracking-tight block leading-none">
              {APP_NAME}
            </span>
            <span className="text-[11px] text-[var(--color-muted)] font-medium hidden sm:block">
              Skyline Student Association
            </span>
          </div>
        </Link>
      </div>

      {/* Right controls: Role switcher, Cart, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Merchandise Cart Trigger */}
        <button
          type="button"
          onClick={toggleOpen}
          className="relative p-2 rounded-[10px] text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
          aria-label="View Cart"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {/* Role Demo Switcher Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-caption font-semibold bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink)] border border-[var(--color-hairline)] transition-colors cursor-pointer"
          >
            <span className="text-[var(--color-muted)] font-normal hidden sm:inline">Role:</span>
            <span className="capitalize">{user?.role.toLowerCase().replace('_', ' ') || 'Guest'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          </button>

          {showRoleMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-[12px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] shadow-[var(--elevation-2)] p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Switch Active Role
                </div>
                {Object.values(ROLES).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      switchRole(role)
                      setShowRoleMenu(false)
                      if (role === ROLES.MEMBER) navigate('/member')
                      else if (role === ROLES.DOOR_STAFF) navigate('/checkin/event-gala-1')
                      else navigate('/admin')
                    }}
                    className="w-full text-left px-3 py-2 text-body-sm font-medium rounded-[8px] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary-deep)] text-[var(--color-ink)] transition-colors cursor-pointer capitalize"
                  >
                    {role.toLowerCase().replace('_', ' ')}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme Picker (System, Light, Dark) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-[10px] text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            aria-label="Theme mode"
          >
            {theme === 'dark' ? (
              <Moon className="w-5 h-5" />
            ) : theme === 'light' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Laptop className="w-5 h-5" />
            )}
          </button>

          {showThemeMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowThemeMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-36 rounded-[12px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] shadow-[var(--elevation-2)] p-1 z-50">
                {[
                  { id: 'system', label: 'System', icon: Laptop },
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTheme(id as ThemePreference)
                      setShowThemeMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-body-sm rounded-[8px] hover:bg-[var(--color-surface)] text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-[var(--color-muted)]" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User initials / Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-[var(--color-hairline)]">
          <div className="w-8 h-8 rounded-full bg-[var(--color-tint-sky)] text-[var(--color-tint-sky-deep)] flex items-center justify-center font-bold text-caption">
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'G'}
          </div>
        </div>
      </div>
    </header>
  )
}
