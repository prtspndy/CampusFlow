import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  HeartHandshake,
  Award,
} from 'lucide-react'
import { volunteerService } from '../../../services/volunteerService'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/feedback/EmptyState'
import type { VolunteerRegistration } from '../../../types/models'
import { cn } from '../../../lib/cn'

export const MyVolunteeringPage: React.FC = () => {
  const [signups, setSignups] = useState<VolunteerRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadSignups = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await volunteerService.getMySignups()
      setSignups(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load your volunteer shifts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSignups()
  }, [])

  const handleCancel = async (signupId: string) => {
    if (!confirm('Are you sure you want to cancel this volunteer registration?')) return
    setError(null)
    try {
      await volunteerService.cancelSignup(signupId)
      setSuccess('Volunteer registration successfully cancelled.')
      await loadSignups()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel registration')
    }
  }

  const activeSignups = signups.filter((s) => s.status === 'REGISTERED')
  const completedSignups = signups.filter((s) => s.status === 'ATTENDED')
  const pastOrCancelledSignups = signups.filter(
    (s) => s.status !== 'REGISTERED' && s.status !== 'ATTENDED'
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
            Member Portal
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            My Volunteering
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Track your registered volunteer commitments, attendance records, and service hours.
          </p>
        </div>

        <Link to="/volunteers">
          <Button variant="primary" size="md" className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4" />
            <span>Browse Opportunities</span>
          </Button>
        </Link>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] space-y-1">
          <span className="text-caption font-semibold text-[var(--color-muted)]">Upcoming Shifts</span>
          <p className="text-heading-1 font-display font-extrabold text-[var(--color-primary)]">
            {activeSignups.length}
          </p>
        </div>
        <div className="p-5 rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] space-y-1">
          <span className="text-caption font-semibold text-[var(--color-muted)]">Completed Shifts</span>
          <p className="text-heading-1 font-display font-extrabold text-emerald-600">
            {completedSignups.length}
          </p>
        </div>
        <div className="p-5 rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] space-y-1">
          <span className="text-caption font-semibold text-[var(--color-muted)]">Total Applications</span>
          <p className="text-heading-1 font-display font-extrabold text-[var(--color-ink)]">
            {signups.length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 rounded-[14px] bg-[var(--color-surface)] animate-pulse" />
          ))}
        </div>
      ) : signups.length === 0 ? (
        <EmptyState
          icon={<Award className="w-8 h-8" />}
          title="No volunteering records yet"
          description="Explore current opportunities to earn points, leadership honors, and community recognition."
        />
      ) : (
        <div className="space-y-8">
          {/* Active Commitments */}
          <div className="space-y-4">
            <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
              Upcoming Volunteer Shifts
            </h2>
            {activeSignups.length === 0 ? (
              <p className="text-body-sm text-[var(--color-muted)] italic">
                You have no upcoming shifts scheduled.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeSignups.map((signup) => {
                  const opp = signup.opportunity
                  return (
                    <div
                      key={signup.id}
                      className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            CONFIRMED
                          </span>
                          <span className="text-caption text-[var(--color-muted)]">
                            Registered on {new Date(signup.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                          {opp?.title || 'Volunteer Role'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-caption text-[var(--color-muted)]">
                          {opp?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              {opp.location}
                            </span>
                          )}
                          {opp?.startsAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              {new Date(opp.startsAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {new Date(opp.startsAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        {signup.notes && (
                          <p className="text-caption text-[var(--color-muted)] italic">
                            Your note: "{signup.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {opp && (
                          <Link to={`/volunteers/${opp.id}`}>
                            <Button variant="secondary" size="sm">
                              View Details
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancel(signup.id)}
                          className="text-red-600 hover:text-red-700 border-red-200"
                        >
                          Cancel Shift
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Past / Completed Shifts */}
          {(completedSignups.length > 0 || pastOrCancelledSignups.length > 0) && (
            <div className="space-y-4">
              <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                Participation History
              </h2>
              <div className="divide-y divide-[var(--color-hairline)] rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] overflow-hidden">
                {[...completedSignups, ...pastOrCancelledSignups].map((signup) => {
                  const opp = signup.opportunity
                  return (
                    <div
                      key={signup.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-body-sm"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-[var(--color-ink)]">
                          {opp?.title || 'Volunteer Role'}
                        </div>
                        <div className="text-caption text-[var(--color-muted)]">
                          {opp?.startsAt
                            ? new Date(opp.startsAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : new Date(signup.createdAt).toLocaleDateString()}
                          {opp?.location && ` • ${opp.location}`}
                        </div>
                        {signup.attendanceNotes && (
                          <p className="text-caption text-emerald-700 dark:text-emerald-400">
                            Feedback: {signup.attendanceNotes}
                          </p>
                        )}
                      </div>

                      <div>
                        <span
                          className={cn(
                            'text-caption font-bold px-2.5 py-1 rounded-full uppercase',
                            signup.status === 'ATTENDED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : signup.status === 'CANCELLED'
                              ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              : signup.status === 'NO_SHOW'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          )}
                        >
                          {signup.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
