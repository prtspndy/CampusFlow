import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { useThemeStore, type ThemePreference } from '../../stores/themeStore'
import { ROLES } from '../../lib/constants'
import {
  Sun,
  Moon,
  Laptop,
  ShoppingBag,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { ProfileModal } from '../../features/auth/components/ProfileModal'

export const TopBar: React.FC = () => {
  const { user, isAuthenticated, isDemoMode, logout, switchRole } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const { setOpen, items } = useCartStore()
  const navigate = useNavigate()

  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleLogout = async () => {
    setShowUserMenu(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-[64px] border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand logo & name */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-[8px] bg-[var(--color-brand-navy)] flex items-center justify-center text-[var(--color-on-primary)] font-heading font-black text-caption tracking-tight group-hover:scale-105 transition-transform">
          CF
        </div>
        <span className="font-heading font-bold text-title-sm text-[var(--color-ink)] tracking-tight">
          Campus<span className="text-[var(--color-sunset)]">Flow</span>
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Merchandise Cart button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
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
            {isDemoMode && (
              <span className="hidden md:inline px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-amber-100 text-amber-800">
                demo
              </span>
            )}
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

        {/* User Account Menu / Auth status */}
        {isAuthenticated && user ? (
          <div className="relative pl-1 border-l border-[var(--color-hairline)]">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[var(--color-primary)] transition-all cursor-pointer"
              aria-label="User account"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand-navy)] text-white flex items-center justify-center font-bold text-caption shadow-[var(--elevation-1)]">
                {user.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'U'}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] shadow-[var(--elevation-3)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-[var(--color-hairline)]">
                    <p className="text-body-sm font-bold text-[var(--color-ink)] truncate">
                      {user.name}
                    </p>
                    <p className="text-[12px] text-[var(--color-muted)] truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)]">
                        {user.role.toLowerCase()}
                      </span>
                      {isDemoMode && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Demo session
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false)
                        setShowProfileModal(true)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-body-sm rounded-[8px] hover:bg-[var(--color-surface)] text-[var(--color-ink)] transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[var(--color-muted)]" />
                      <span>Profile & Account</span>
                    </button>

                    {(user.role === ROLES.ADMIN || user.role === ROLES.TREASURER) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/admin')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-body-sm rounded-[8px] hover:bg-[var(--color-surface)] text-[var(--color-ink)] transition-colors cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-[var(--color-muted)]" />
                        <span>Admin Console</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/member')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-body-sm rounded-[8px] hover:bg-[var(--color-surface)] text-[var(--color-ink)] transition-colors cursor-pointer"
                    >
                      <span>Member Portal</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[var(--color-hairline)]">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-rose-600 rounded-[8px] hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-1 border-l border-[var(--color-hairline)]">
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-caption font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/register"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-caption font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-pressed)] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </Link>
          </div>
        )}
      </div>

      {/* Profile inspection & edit modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  )
}
