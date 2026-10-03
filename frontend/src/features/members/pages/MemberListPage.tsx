import React, { useState, useEffect, useCallback } from 'react'
import { UserPlus, RefreshCw, AlertCircle, Users } from 'lucide-react'
import { MOCK_MEMBERS } from '../../../lib/mockData'
import { FilterChips } from '../../../components/forms/FilterChips'
import { SearchPill } from '../../../components/forms/SearchPill'
import { StatusBadge } from '../../../components/badges/StatusBadge'
import { Button } from '../../../components/ui/Button'
import { authService } from '../../auth/services/authService'
import { useAuthStore } from '../../../stores/authStore'
import type { User } from '../../../types/models'
import { ROLES } from '../../../lib/constants'

export const MemberListPage: React.FC = () => {
  const { isDemoMode, user: currentUser } = useAuthStore()
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState<User[]>(MOCK_MEMBERS)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'backend' | 'demo'>(isDemoMode ? 'demo' : 'backend')

  const fetchBackendUsers = useCallback(async () => {
    // Only attempt real admin user list if user is admin and not purely demo
    if (isDemoMode && currentUser?.role !== ROLES.ADMIN) {
      setMembers(MOCK_MEMBERS)
      setDataSource('demo')
      return
    }

    setIsLoading(true)
    setApiError(null)

    try {
      const response = await authService.listAdminUsers()
      if (response && response.users && response.users.length > 0) {
        const mappedUsers: User[] = response.users.map((u, idx) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          studentId: `SKY-2024-${(8000 + idx).toString()}`,
          role: u.role.toUpperCase() as User['role'],
          status: u.status,
          membership: {
            id: `mem-${u.id.substring(0, 6)}`,
            userId: u.id,
            memberCode: `CF-${u.id.substring(0, 4).toUpperCase()}-2026`,
            status: u.status === 'active' ? 'ACTIVE' : 'EXPIRED',
            validUntil: '2026-12-31T23:59:59Z',
            planName: u.role === 'admin' ? 'Executive Leadership' : 'Annual Gold Member',
            perks: ['Member ticket prices', '15% Merch discount', 'Priority RSVP'],
          },
        }))
        setMembers(mappedUsers)
        setDataSource('backend')
      } else {
        setMembers(MOCK_MEMBERS)
        setDataSource('demo')
      }
    } catch (err: unknown) {
      // Graceful fallback to mock data on offline or unauthorized
      const msg = err instanceof Error ? err.message : 'Could not fetch remote users'
      setApiError(msg)
      setMembers(MOCK_MEMBERS)
      setDataSource('demo')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode, currentUser])

  useEffect(() => {
    fetchBackendUsers()
  }, [fetchBackendUsers])

  const statusOptions = [
    { value: 'ALL', label: 'All Members', count: members.length },
    {
      value: 'ACTIVE',
      label: 'Active',
      count: members.filter((m) => m.membership?.status === 'ACTIVE').length,
    },
    {
      value: 'EXPIRING',
      label: 'Expiring',
      count: members.filter((m) => m.membership?.status === 'EXPIRING').length,
    },
    {
      value: 'EXPIRED',
      label: 'Expired',
      count: members.filter((m) => m.membership?.status === 'EXPIRED').length,
    },
  ]

  const filteredMembers = members.filter((m) => {
    const memStatus = m.membership?.status
    const matchesStatus =
      selectedStatus === 'ALL' || memStatus === selectedStatus
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.studentId && m.studentId.toLowerCase().includes(search.toLowerCase())) ||
      (m.membership?.memberCode &&
        m.membership.memberCode.toLowerCase().includes(search.toLowerCase()))

    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-sky-deep)]">
              Membership Records
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                dataSource === 'backend'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {dataSource === 'backend' ? 'Live API (GET /api/admin/users)' : 'Local Demo Roster'}
            </span>
          </div>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Member Directory
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Active club passes, dues status, and renewal reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={fetchBackendUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Users</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => alert('New member registration can be done via /join or /register')}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      {/* Notice if API error occurred */}
      {apiError && (
        <div className="p-3.5 rounded-[12px] bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 text-body-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Connected in demo mode ({apiError}). Showing bundled member records.
            </span>
          </div>
          <button
            type="button"
            onClick={fetchBackendUsers}
            className="font-semibold underline hover:no-underline cursor-pointer"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <FilterChips
          options={statusOptions}
          selected={selectedStatus}
          onChange={setSelectedStatus}
        />

        <div className="w-full md:w-72">
          <SearchPill
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search by name, ID or code..."
          />
        </div>
      </div>

      {/* Member Table */}
      <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-body-sm text-[var(--color-muted)]">
            <div className="w-8 h-8 rounded-full border-3 border-[var(--color-primary-tint)] border-t-[var(--color-primary)] animate-spin mx-auto mb-3" />
            Loading member directory from API...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center text-body-sm text-[var(--color-muted)]">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-[var(--color-ink)]">No members found</p>
            <p className="mt-1">Try adjusting your status filter or search query.</p>
            {search && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearch('')}
                className="mt-3"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-hairline)] text-micro-uppercase text-[var(--color-muted)] font-bold">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)] text-body-sm">
                {filteredMembers.map((member) => {
                  const mem = member.membership!
                  const statusVariant =
                    mem.status === 'ACTIVE'
                      ? 'active'
                      : mem.status === 'EXPIRING'
                      ? 'expiring'
                      : 'expired'

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-navy)] text-white flex items-center justify-center font-bold text-caption shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--color-ink)] leading-snug">
                              {member.name}
                            </div>
                            <div className="text-caption text-[var(--color-muted)]">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--color-muted)] font-mono text-[13px]">
                        {member.studentId || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] font-semibold text-[var(--color-primary-deep)]">
                        {mem.memberCode}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-body)]">
                        {mem.planName}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-muted)]">
                        {new Date(mem.validUntil).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          variant={statusVariant}
                          label={mem.status}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => alert(`View details for ${member.name}`)}
                          className="text-caption font-semibold text-[var(--color-primary-deep)] hover:underline cursor-pointer"
                        >
                          View Pass
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
