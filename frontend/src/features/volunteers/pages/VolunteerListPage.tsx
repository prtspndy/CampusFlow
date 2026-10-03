import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  PlusCircle,
  HeartHandshake,
} from 'lucide-react'
import { volunteerService } from '../../../services/volunteerService'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { StatusBadge } from '../../../components/badges/StatusBadge'
import type { VolunteerOpportunity, VolunteerRegistration } from '../../../types/models'
import { cn } from '../../../lib/cn'

export const VolunteerListPage: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([])
  const [mySignups, setMySignups] = useState<VolunteerRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'CLOSED'>('ALL')

  // Signup Modal state
  const [selectedOpp, setSelectedOpp] = useState<VolunteerOpportunity | null>(null)
  const [signupNotes, setSignupNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setActionError(null)
    try {
      const res = await volunteerService.listOpportunities({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as any),
      })
      setOpportunities(res.opportunities || [])

      if (user) {
        try {
          const signups = await volunteerService.getMySignups()
          setMySignups(signups || [])
        } catch {
          // not critical
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load volunteer opportunities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [statusFilter, user])

  const handleOpenSignup = (opp: VolunteerOpportunity) => {
    setSelectedOpp(opp)
    setSignupNotes('')
    setActionError(null)
    setActionSuccess(null)
  }

  const handleConfirmSignup = async () => {
    if (!selectedOpp) return
    setSubmitting(true)
    setActionError(null)
    try {
      await volunteerService.signup(selectedOpp.id, { notes: signupNotes.trim() || undefined })
      setActionSuccess(`Successfully registered for "${selectedOpp.title}"!`)
      setSelectedOpp(null)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || 'Failed to sign up for this opportunity')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelSignup = async (signupId: string) => {
    if (!confirm('Are you sure you want to cancel your volunteer registration?')) return
    setActionError(null)
    try {
      await volunteerService.cancelSignup(signupId)
      setActionSuccess('Volunteer registration successfully cancelled.')
      await loadData()
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel registration')
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      opp.title.toLowerCase().includes(q) ||
      opp.description.toLowerCase().includes(q) ||
      opp.location.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
            Community & Service
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Volunteer Opportunities
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Build leadership skills, give back to campus, and earn verified volunteer hours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Link to="/member/volunteering">
              <Button variant="secondary" size="md" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>My Volunteer Shifts</span>
              </Button>
            </Link>
          )}
          {user && (user.role === 'ADMIN' || user.role === 'EVENT_MANAGER') && (
            <Link to="/admin/volunteers">
              <Button variant="primary" size="md" className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Manage Opportunities</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'PUBLISHED', 'CLOSED'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-caption font-semibold transition-colors cursor-pointer',
                statusFilter === filter
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)] border border-[var(--color-hairline)]'
              )}
            >
              {filter === 'ALL' ? 'All Roles' : filter === 'PUBLISHED' ? 'Open Opportunities' : 'Closed'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-body-sm bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[10px] text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Opportunity Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-[14px] bg-[var(--color-surface)] animate-pulse" />
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          icon={<HeartHandshake className="w-8 h-8" />}
          title="No volunteer opportunities found"
          description="Check back soon for upcoming club events, charity drives, and leadership assignments."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp) => {
            const signup = mySignups.find(
              (s) => s.opportunityId === opp.id && s.status === 'REGISTERED'
            )
            const isFull = opp.registeredCount >= opp.capacity
            const spotsLeft = Math.max(0, opp.capacity - opp.registeredCount)
            const percentFilled = Math.min(100, Math.round((opp.registeredCount / opp.capacity) * 100))

            return (
              <div
                key={opp.id}
                className="flex flex-col justify-between rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-tint-sky)] text-[var(--color-tint-sky-deep)]">
                      {opp.category || 'General Service'}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-md',
                        opp.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      )}
                    >
                      {opp.status}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors">
                      <Link to={`/volunteers/${opp.id}`}>{opp.title}</Link>
                    </h2>
                    <p className="text-body-sm text-[var(--color-muted)] line-clamp-2 mt-1">
                      {opp.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-caption text-[var(--color-muted)] pt-2 border-t border-[var(--color-hairline)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                      <span className="truncate">{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                      <span>
                        {new Date(opp.startsAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(opp.startsAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {opp.event && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                        <span className="truncate">Event: {opp.event.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity progress */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-caption font-medium">
                      <span className="flex items-center gap-1.5 text-[var(--color-ink)]">
                        <Users className="w-3.5 h-3.5" />
                        {opp.registeredCount} / {opp.capacity} volunteers
                      </span>
                      <span
                        className={cn(
                          'font-bold',
                          isFull ? 'text-amber-600' : 'text-emerald-600'
                        )}
                      >
                        {isFull ? 'Full' : `${spotsLeft} slots left`}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-hairline)] h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isFull ? 'bg-amber-500' : 'bg-[var(--color-primary)]'
                        )}
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-6 mt-4 border-t border-[var(--color-hairline)] flex items-center justify-between gap-3">
                  <Link
                    to={`/volunteers/${opp.id}`}
                    className="text-body-sm font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    View Details
                  </Link>

                  {signup ? (
                    <div className="flex items-center gap-2">
                      <span className="text-caption font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Registered
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCancelSignup(signup.id)}
                        className="text-red-600 hover:text-red-700 text-xs py-1 px-2.5 h-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : opp.status !== 'PUBLISHED' ? (
                    <Button variant="secondary" size="sm" disabled>
                      Closed
                    </Button>
                  ) : isFull ? (
                    <Button variant="secondary" size="sm" disabled>
                      Filled
                    </Button>
                  ) : !user ? (
                    <Link to="/login">
                      <Button variant="primary" size="sm">
                        Sign In to Join
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenSignup(opp)}
                    >
                      Sign Up
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sign-up Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-canvas)] rounded-[16px] border border-[var(--color-hairline)] p-6 shadow-xl space-y-5">
            <div>
              <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
                Volunteer Sign-Up
              </span>
              <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)] mt-1">
                {selectedOpp.title}
              </h3>
              <p className="text-body-sm text-[var(--color-muted)] mt-1">
                {selectedOpp.location} •{' '}
                {new Date(selectedOpp.startsAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            {selectedOpp.eligibility && (
              <div className="p-3 bg-[var(--color-tint-sky)] text-[var(--color-tint-sky-deep)] rounded-[10px] text-caption">
                <strong>Eligibility Notice:</strong> {selectedOpp.eligibility}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                Volunteer Notes or Availability (Optional)
              </label>
              <textarea
                rows={3}
                value={signupNotes}
                onChange={(e) => setSignupNotes(e.target.value)}
                placeholder="Share any special skills, arrival notes, or equipment you can bring..."
                className="w-full p-3 text-body-sm bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[10px] text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedOpp(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmSignup}
                disabled={submitting}
              >
                {submitting ? 'Registering...' : 'Confirm Registration'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
