import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Calendar, Megaphone, ArrowRight, HeartHandshake, Receipt } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { EventCard } from '../../../components/cards/EventCard'
import { StatusBadge } from '../../../components/badges/StatusBadge'
import { eventApiService, type BackendEvent } from '../../events/services/eventService'
import { api } from '../../../lib/api'
import type { ClubEvent } from '../../../types/models'
import type { EventStatus } from '../../../types/enums'

interface AnnouncementItem {
  id: string
  title: string
  body: string
  authorName: string
  authorRole: string
  publishedAt: string | null
}

function toClubEvent(b: BackendEvent): ClubEvent {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    venue: b.venue,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    memberPrice: b.memberPrice,
    standardPrice: b.standardPrice,
    totalCapacity: b.totalCapacity,
    registeredCount: b.registeredCount,
    status: b.status as EventStatus,
    category: b.category || undefined,
    imageUrl: b.imageUrl || undefined,
    isFeatured: b.isFeatured,
  }
}

export const MemberHome: React.FC = () => {
  const { user } = useAuthStore()
  const membership = user?.membership
  const [upcomingEvent, setUpcomingEvent] = useState<ClubEvent | null>(null)
  const [latestAnnouncement, setLatestAnnouncement] = useState<AnnouncementItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    Promise.allSettled([
      eventApiService.listEvents({ limit: 1 }),
      api.get<{ announcements: AnnouncementItem[] }>('/announcements?limit=1', { auth: false }),
    ]).then(([eventsResult, announcementsResult]) => {
      if (isCancelled) return
      if (eventsResult.status === 'fulfilled' && eventsResult.value.events?.length > 0) {
        setUpcomingEvent(toClubEvent(eventsResult.value.events[0]))
      } else {
        setUpcomingEvent(null)
      }

      if (
        announcementsResult.status === 'fulfilled' &&
        announcementsResult.value.announcements?.length > 0
      ) {
        setLatestAnnouncement(announcementsResult.value.announcements[0])
      } else {
        setLatestAnnouncement(null)
      }
      setLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Member Hero / Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-micro-uppercase text-[var(--color-muted)] font-bold">
            Student Union Portal
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Hi, {user?.name ? user.name.split(' ')[0] : 'Member'} 👋
          </h1>
        </div>

        {membership && (
          <StatusBadge
            variant={membership.status === 'ACTIVE' ? 'active' : 'expiring'}
            label={membership.status === 'ACTIVE' ? 'Active Member' : 'Expiring Soon'}
          />
        )}
      </div>

      {/* Quick Access Digital Pass Card */}
      {membership && (
        <Link
          to="/member/pass"
          className="group block relative overflow-hidden rounded-[14px] bg-[var(--color-brand-navy)] text-white p-5 shadow-[var(--elevation-2)] transition-transform hover:-translate-y-0.5"
        >
          <div className="h-1 absolute top-0 inset-x-0 bg-[var(--color-sunset)]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center text-[var(--color-sunset)]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[12px] text-white/70 block uppercase font-bold tracking-wider">
                  Digital Pass Ready
                </span>
                <span className="text-heading-3 font-display font-bold text-white">
                  {membership.memberCode}
                </span>
              </div>
            </div>

            <span className="flex items-center gap-1 text-caption font-semibold text-white/90 group-hover:translate-x-0.5 transition-transform">
              <span>View QR</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      )}

      {/* Member Quick Services */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/member/volunteering"
          className="p-4 rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-hairline)] hover:border-[var(--color-primary)] transition-colors flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-body-sm font-bold text-[var(--color-ink)]">Volunteering</h3>
            <p className="text-[11px] text-[var(--color-muted)]">My shifts & hours</p>
          </div>
        </Link>

        <Link
          to="/member/expenses"
          className="p-4 rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-hairline)] hover:border-[var(--color-primary)] transition-colors flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-[10px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-body-sm font-bold text-[var(--color-ink)]">Claim Expense</h3>
            <p className="text-[11px] text-[var(--color-muted)]">Reimbursements</p>
          </div>
        </Link>
      </div>

      {/* Featured Upcoming Event */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
            <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
              Next Event
            </h2>
          </div>
          <Link
            to="/events"
            className="text-caption font-semibold text-[var(--color-primary)] hover:underline"
          >
            See all
          </Link>
        </div>

        {upcomingEvent ? (
          <EventCard event={upcomingEvent} />
        ) : loading ? (
          <div className="rounded-[14px] bg-[var(--color-surface)] p-6 text-center text-body-sm text-[var(--color-muted)] border border-[var(--color-hairline)]">
            Loading next event…
          </div>
        ) : (
          <div className="rounded-[14px] bg-[var(--color-surface)] p-6 text-center text-body-sm text-[var(--color-muted)] border border-[var(--color-hairline)]">
            No upcoming events scheduled right now.
          </div>
        )}
      </div>

      {/* Latest Announcement Preview */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[var(--color-tint-lavender-deep)]" />
            <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
              Latest Update
            </h2>
          </div>
          <Link
            to="/announcements"
            className="text-caption font-semibold text-[var(--color-primary)] hover:underline"
          >
            Feed
          </Link>
        </div>

        {latestAnnouncement ? (
          <div className="rounded-[14px] bg-[var(--color-tint-lavender)] text-[var(--color-tint-lavender-deep)] p-5 border border-purple-200/40 dark:border-purple-800/30">
            <span className="text-caption font-semibold opacity-85 block mb-1">
              From {latestAnnouncement.authorName} ({latestAnnouncement.authorRole})
            </span>
            <h4 className="text-heading-3 font-display font-bold text-[var(--color-ink)] leading-snug mb-2">
              {latestAnnouncement.title}
            </h4>
            <p className="text-body-sm text-[var(--color-body)] line-clamp-2">
              {latestAnnouncement.body}
            </p>
          </div>
        ) : loading ? (
          <div className="rounded-[14px] bg-[var(--color-surface)] p-6 text-center text-body-sm text-[var(--color-muted)] border border-[var(--color-hairline)]">
            Loading announcements…
          </div>
        ) : (
          <div className="rounded-[14px] bg-[var(--color-surface)] p-6 text-center text-body-sm text-[var(--color-muted)] border border-[var(--color-hairline)]">
            No announcements published yet.
          </div>
        )}
      </div>
    </div>
  )
}
