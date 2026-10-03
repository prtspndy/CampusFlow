import React from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Calendar, Megaphone, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { MOCK_EVENTS, MOCK_ANNOUNCEMENTS } from '../../../lib/mockData'
import { EventCard } from '../../../components/cards/EventCard'
import { StatusBadge } from '../../../components/badges/StatusBadge'

export const MemberHome: React.FC = () => {
  const { user } = useAuthStore()
  const membership = user?.membership
  const upcomingEvent = MOCK_EVENTS[0]
  const latestAnnouncement = MOCK_ANNOUNCEMENTS[0]

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

        <EventCard event={upcomingEvent} />
      </div>

      {/* Latest Announcement Preview */}
      {latestAnnouncement && (
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
        </div>
      )}
    </div>
  )
}
