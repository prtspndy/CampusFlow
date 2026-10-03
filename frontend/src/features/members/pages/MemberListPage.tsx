import React, { useState, useEffect } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { MOCK_MEMBERS } from '../../../lib/mockData'
import { FilterChips } from '../../../components/forms/FilterChips'
import { SearchPill } from '../../../components/forms/SearchPill'
import { StatusBadge } from '../../../components/badges/StatusBadge'
import { Button } from '../../../components/ui/Button'
import { membershipApiService } from '../services/membershipService'
import type { User, Membership } from '../../../types/models'
import type { MembershipStatus } from '../../../types/enums'

export const MemberListPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState<User[]>(MOCK_MEMBERS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const loadMembers = async () => {
      setLoading(true)
      try {
        const res = await membershipApiService.listMemberships({
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: search.trim() || undefined,
        })
        if (!isCancelled && res.memberships) {
          const mapped: User[] = res.memberships.map((item) => ({
            id: item.userId,
            name: item.user.name,
            email: item.user.email,
            role: 'MEMBER',
            membership: {
              id: item.id,
              userId: item.userId,
              memberCode: item.memberCode,
              status: item.status as MembershipStatus,
              validUntil: item.validUntil,
              planName: item.planName,
              perks: item.perks,
            } as Membership,
          }))
          setMembers(mapped)
        }
      } catch {
        // Fallback to MOCK_MEMBERS if offline or permission denied
        if (!isCancelled) {
          setMembers(MOCK_MEMBERS)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void loadMembers()
    return () => {
      isCancelled = true
    }
  }, [selectedStatus, search])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-sky-deep)]">
            Membership Records
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Member Directory
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Active club passes, dues status, and renewal tracking.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => alert('New member invitations can be registered from the public Join portal.')}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </Button>
      </div>

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
              {loading && filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                      <span>Loading member directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-muted)]">
                    No members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const mem = member.membership
                  const statusVariant =
                    mem?.status === 'ACTIVE'
                      ? 'active'
                      : mem?.status === 'EXPIRING'
                      ? 'expiring'
                      : 'expired'

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-[var(--color-surface)]/60 transition-colors h-14"
                    >
                      <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">
                        {member.name}
                        <span className="block text-caption text-[var(--color-muted)] font-normal">
                          {member.email}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-[var(--color-muted)]">
                        {member.studentId || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[13px] text-[var(--color-primary)]">
                        {mem?.memberCode || '—'}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-body)]">
                        {mem?.planName || 'General'}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-muted)] text-caption">
                        {mem?.validUntil
                          ? new Date(mem.validUntil).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {mem ? (
                          <StatusBadge variant={statusVariant} label={mem.status} />
                        ) : (
                          <span className="text-caption text-[var(--color-muted)]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert(`Member pass code: ${mem?.memberCode || 'N/A'}`)}
                        >
                          View Pass
                        </Button>
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
export default MemberListPage
