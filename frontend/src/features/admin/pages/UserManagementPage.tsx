import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Crown,
  Calendar,
  Landmark,
  User,
  ShieldAlert,
} from 'lucide-react'
import { authApi, type ApiUser } from '../../../lib/authApi'
import { ROLE_DISPLAY_NAMES, ROLES, type UserRole } from '../../../lib/constants'
import { useAuthStore } from '../../../stores/authStore'
import { isApiError } from '../../../lib/api'

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ADMIN: Crown,
  EVENT_MANAGER: Calendar,
  TREASURER: Landmark,
  MEMBER: User,
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: {
    bg: 'var(--color-primary-tint, #ede9fe)',
    text: 'var(--color-primary-deep, #5b21b6)',
    border: 'var(--color-primary, #7c3aed)',
  },
  EVENT_MANAGER: {
    bg: 'var(--color-tint-peach, #ffedd5)',
    text: 'var(--color-tint-peach-deep, #9a3412)',
    border: 'var(--color-sunset, #ea580c)',
  },
  TREASURER: {
    bg: 'var(--color-tint-sage, #dcfce7)',
    text: 'var(--color-tint-sage-deep, #166534)',
    border: '#22c55e',
  },
  MEMBER: {
    bg: 'var(--color-tint-sky, #e0f2fe)',
    text: 'var(--color-tint-sky-deep, #075985)',
    border: '#0ea5e9',
  },
}

export const UserManagementPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true)
      setErrorMessage(null)
      const data = await authApi.listUsers()
      setUsers(data.users ?? [])
    } catch (err) {
      if (isApiError(err)) {
        setErrorMessage(err.message || 'Failed to load user list.')
      } else {
        setErrorMessage('Failed to connect to backend server.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, targetName: string, newRole: string) => {
    if (!newRole) return

    setErrorMessage(null)
    setSuccessMessage(null)
    setUpdatingUserId(userId)

    try {
      const result = await authApi.updateUserRole(userId, newRole)
      setSuccessMessage(
        `Role for ${targetName} updated to ${ROLE_DISPLAY_NAMES[newRole] ?? newRole}. Active sessions revoked.`,
      )
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: result.user.role, updatedAt: result.user.updatedAt } : u,
        ),
      )
    } catch (err) {
      if (isApiError(err)) {
        setErrorMessage(err.message || 'Failed to assign role.')
      } else {
        setErrorMessage('An unexpected error occurred while updating the role.')
      }
    } finally {
      setUpdatingUserId(null)
    }
  }

  const roleFilterOptions = [
    { value: 'ALL', label: 'All Roles', count: users.length },
    {
      value: ROLES.ADMIN,
      label: 'Admins',
      count: users.filter((u) => u.role.toUpperCase() === ROLES.ADMIN).length,
    },
    {
      value: ROLES.EVENT_MANAGER,
      label: 'Event Managers',
      count: users.filter((u) => u.role.toUpperCase() === ROLES.EVENT_MANAGER).length,
    },
    {
      value: ROLES.TREASURER,
      label: 'Treasurers',
      count: users.filter((u) => u.role.toUpperCase() === ROLES.TREASURER).length,
    },
    {
      value: ROLES.MEMBER,
      label: 'Members',
      count: users.filter((u) => u.role.toUpperCase() === ROLES.MEMBER).length,
    },
  ]

  const filteredUsers = users.filter((u) => {
    const normRole = u.role.toUpperCase()
    const matchesRole = roleFilter === 'ALL' || normRole === roleFilter
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    return matchesRole && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary-deep)]">
            Administration & Security
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Users & Role Permissions
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Database-backed Role-Based Access Control (RBAC) across four canonical organization roles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchUsers(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-body-sm font-semibold bg-[var(--color-canvas)] text-[var(--color-body)] border border-[var(--color-hairline)] hover:bg-[var(--color-surface)] disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Role Architecture Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(['ADMIN', 'EVENT_MANAGER', 'TREASURER', 'MEMBER'] as const).map((r) => {
          const colors = ROLE_COLORS[r]
          const Icon = ROLE_ICONS[r]
          return (
            <div
              key={r}
              className="p-3.5 rounded-[12px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-caption-bold font-bold text-[var(--color-ink)] truncate">
                    {r.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-caption text-[var(--color-muted)] leading-relaxed">
                  {r === 'ADMIN' && 'Full organization control, user role assignment, system settings.'}
                  {r === 'EVENT_MANAGER' && 'Events lifecycle, draft reviews, ticket check-in scanner.'}
                  {r === 'TREASURER' && 'Financial ledger, dues, budget oversight, reimbursement reviews.'}
                  {r === 'MEMBER' && 'Club membership pass, event attendance, ticket purchases.'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-[12px] bg-[var(--color-danger-tint, #fee2e2)] text-[var(--color-danger-deep, #991b1b)] border border-red-300 animate-fadeIn"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-body-sm font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 p-4 rounded-[12px] bg-[var(--color-tint-sage, #dcfce7)] text-[var(--color-tint-sage-deep, #166534)] border border-emerald-300 animate-fadeIn"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-body-sm font-medium">{successMessage}</div>
        </div>
      )}

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {roleFilterOptions.map((opt) => {
            const active = roleFilter === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRoleFilter(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption-bold font-medium transition-all ${
                  active
                    ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)] shadow-xs'
                    : 'bg-[var(--color-canvas)] text-[var(--color-muted)] border border-[var(--color-hairline)] hover:bg-[var(--color-surface)]'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-sunken)] text-[var(--color-muted)]'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-[10px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] text-body-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
      </div>

      {/* User Directory Table */}
      <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-surface)] text-micro-uppercase text-[var(--color-muted)] font-bold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Canonical Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)] text-body-sm">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--color-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                      <span>Loading user directory from server...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--color-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-[var(--color-muted)] opacity-60" />
                      <p className="font-medium text-[var(--color-ink)]">No users found</p>
                      <p className="text-caption">Try adjusting your search query or role filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const normRole = (u.role.toUpperCase() as UserRole) || 'MEMBER'
                  const colors = ROLE_COLORS[normRole] ?? ROLE_COLORS.MEMBER
                  const isCurrentUser = currentUser?.id === u.id
                  const isUpdating = updatingUserId === u.id

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--color-surface-sunken)]/50 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-hairline)] flex items-center justify-center font-bold text-[var(--color-primary-deep)] text-caption shrink-0">
                            {u.name
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[var(--color-ink)] truncate">
                                {u.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-hairline)]">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-caption text-[var(--color-muted)] truncate block">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Current Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption-bold font-semibold border"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{ROLE_DISPLAY_NAMES[normRole] ?? normRole}</span>
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium ${
                            u.status === 'active'
                              ? 'bg-[var(--color-tint-sage)] text-[var(--color-tint-sage-deep)]'
                              : 'bg-[var(--color-danger-tint)] text-[var(--color-danger-deep)]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-caption text-[var(--color-muted)] whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Role Assignment Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {isUpdating ? (
                            <div className="flex items-center gap-1.5 text-caption text-[var(--color-primary-deep)] font-medium">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <select
                              value={normRole}
                              aria-label={`Change role for ${u.name}`}
                              onChange={(e) => void handleRoleChange(u.id, u.name, e.target.value)}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-[8px] bg-[var(--color-surface)] border border-[var(--color-hairline)] text-caption font-medium text-[var(--color-ink)] hover:border-[var(--color-hairline-strong)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
                            >
                              <option value="ADMIN">ADMIN (President)</option>
                              <option value="EVENT_MANAGER">EVENT_MANAGER (Events/Ops)</option>
                              <option value="TREASURER">TREASURER (Finance)</option>
                              <option value="MEMBER">MEMBER (Student)</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default UserManagementPage
