import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  User,
  HeartHandshake,
} from 'lucide-react'
import { volunteerService } from '../../../services/volunteerService'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/Button'
import type { VolunteerOpportunity, VolunteerRegistration } from '../../../types/models'
import { cn } from '../../../lib/cn'

export const VolunteerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [opp, setOpp] = useState<VolunteerOpportunity | null>(null)
  const [signup, setSignup] = useState<VolunteerRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const opportunity = await volunteerService.getOpportunity(id)
      setOpp(opportunity)

      if (user) {
        const mySignups = await volunteerService.getMySignups()
        const match = mySignups.find((s) => s.opportunityId === id && s.status !== 'CANCELLED')
        setSignup(match || null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunity details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [id, user])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await volunteerService.signup(id, { notes: notes.trim() || undefined })
      setSignup(res)
      setSuccess('You have successfully registered for this volunteer opportunity!')
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelSignup = async () => {
    if (!signup) return
    if (!confirm('Are you sure you want to cancel your volunteer shift?')) return
    setSubmitting(true)
    setError(null)
    try {
      await volunteerService.cancelSignup(signup.id)
      setSignup(null)
      setSuccess('Your volunteer registration has been cancelled.')
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel registration')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-[var(--color-surface)] rounded w-1/3" />
        <div className="h-64 bg-[var(--color-surface)] rounded-2xl" />
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-heading-2 font-display font-bold">Opportunity Not Found</h2>
        <p className="text-body-sm text-[var(--color-muted)]">
          The requested volunteer opportunity may have been removed or does not exist.
        </p>
        <Link to="/volunteers">
          <Button variant="secondary" size="md">
            Back to Opportunities
          </Button>
        </Link>
      </div>
    )
  }

  const isFull = opp.registeredCount >= opp.capacity
  const spotsLeft = Math.max(0, opp.capacity - opp.registeredCount)
  const isDeadlinePassed = opp.applicationDeadline
    ? new Date(opp.applicationDeadline).getTime() < Date.now()
    : false

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        to="/volunteers"
        className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All Opportunities</span>
      </Link>

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

      {/* Main Card */}
      <div className="rounded-[16px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-micro-uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[var(--color-tint-sky)] text-[var(--color-tint-sky-deep)]">
              {opp.category || 'Volunteer Role'}
            </span>
            <span
              className={cn(
                'text-caption font-semibold px-2.5 py-0.5 rounded-full',
                opp.status === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              )}
            >
              {opp.status}
            </span>
          </div>

          <div className="text-body-sm font-semibold text-[var(--color-muted)]">
            Organized by: <span className="text-[var(--color-ink)]">{opp.organizer?.name || 'Club Staff'}</span>
          </div>
        </div>

        <div>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)]">
            {opp.title}
          </h1>
          <p className="text-body-md text-[var(--color-body)] mt-3 whitespace-pre-line leading-relaxed">
            {opp.description}
          </p>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-[12px] bg-[var(--color-surface)] border border-[var(--color-hairline)]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-caption font-semibold text-[var(--color-muted)]">
              <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Location</span>
            </div>
            <p className="text-body-sm font-bold text-[var(--color-ink)]">{opp.location}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-caption font-semibold text-[var(--color-muted)]">
              <Clock className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Shift Timing</span>
            </div>
            <p className="text-body-sm font-bold text-[var(--color-ink)]">
              {new Date(opp.startsAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}{' '}
              {new Date(opp.startsAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              -{' '}
              {new Date(opp.endsAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-caption font-semibold text-[var(--color-muted)]">
              <Users className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Volunteer Capacity</span>
            </div>
            <p className="text-body-sm font-bold text-[var(--color-ink)]">
              {opp.registeredCount} / {opp.capacity} registered ({spotsLeft} remaining)
            </p>
          </div>

          {opp.event && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-caption font-semibold text-[var(--color-muted)]">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Associated Event</span>
              </div>
              <p className="text-body-sm font-bold text-[var(--color-ink)]">
                <Link to={`/events/${opp.event.id}`} className="hover:underline text-[var(--color-primary)]">
                  {opp.event.title}
                </Link>
              </p>
            </div>
          )}

          {opp.applicationDeadline && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-caption font-semibold text-[var(--color-muted)]">
                <AlertCircle className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Application Deadline</span>
              </div>
              <p
                className={cn(
                  'text-body-sm font-bold',
                  isDeadlinePassed ? 'text-red-600' : 'text-[var(--color-ink)]'
                )}
              >
                {new Date(opp.applicationDeadline).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {isDeadlinePassed && ' (Expired)'}
              </p>
            </div>
          )}
        </div>

        {opp.eligibility && (
          <div className="p-4 rounded-[12px] bg-[var(--color-tint-butter)] text-[var(--color-tint-butter-deep)] border border-yellow-200/60 dark:border-yellow-900/40 text-body-sm">
            <span className="font-bold">Eligibility & Requirements: </span>
            {opp.eligibility}
          </div>
        )}

        {/* Registration Section */}
        <div className="pt-6 border-t border-[var(--color-hairline)]">
          {signup ? (
            <div className="p-6 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-body-md">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>You are registered for this volunteer opportunity</span>
                </div>
                <span className="px-3 py-1 rounded-full text-caption font-bold uppercase bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  {signup.status}
                </span>
              </div>

              {signup.notes && (
                <p className="text-body-sm text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">Your notes:</span> {signup.notes}
                </p>
              )}

              {signup.attendanceNotes && (
                <p className="text-body-sm text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">Coordinator feedback:</span> {signup.attendanceNotes}
                </p>
              )}

              {signup.status === 'REGISTERED' && (
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleCancelSignup}
                    disabled={submitting}
                    className="text-red-600 hover:text-red-700 border-red-200"
                  >
                    {submitting ? 'Cancelling...' : 'Cancel My Registration'}
                  </Button>
                </div>
              )}
            </div>
          ) : !user ? (
            <div className="p-6 rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-hairline)] text-center space-y-3">
              <HeartHandshake className="w-10 h-10 text-[var(--color-primary)] mx-auto" />
              <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                Ready to make an impact?
              </h3>
              <p className="text-body-sm text-[var(--color-muted)] max-w-md mx-auto">
                Sign in with your student or campus account to join this volunteer shift.
              </p>
              <Link to="/login">
                <Button variant="primary" size="md">
                  Sign In to Register
                </Button>
              </Link>
            </div>
          ) : opp.status !== 'PUBLISHED' ? (
            <div className="p-4 rounded-[12px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-body-sm text-center">
              This opportunity is not currently open for registrations.
            </div>
          ) : isFull ? (
            <div className="p-4 rounded-[12px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-body-sm text-center">
              All volunteer slots for this role have been filled.
            </div>
          ) : isDeadlinePassed ? (
            <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-body-sm text-center">
              The application deadline for this opportunity has passed.
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                Confirm Volunteer Sign-Up
              </h3>
              <div className="space-y-1.5">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Notes or Availability (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any prior experience, arrival time specifics, or dietary needs..."
                  className="w-full p-3 text-body-sm bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[10px] text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <Button variant="primary" size="md" type="submit" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register for Shift'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
