import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Clock } from 'lucide-react'
import type { ClubEvent } from '../../types/models'
import { MemberPriceBadge } from '../badges/MemberPriceBadge'
import { SeatMeter } from '../data-display/SeatMeter'
import { formatMoney } from '../../lib/format'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/cn'

export interface EventCardProps {
  event: ClubEvent
  className?: string
}

export const EventCard: React.FC<EventCardProps> = ({ event, className }) => {
  const { user } = useAuthStore()
  const isMember = !!user?.membership && user.membership.status === 'ACTIVE'

  const dateObj = new Date(event.startsAt)
  const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const dayStr = dateObj.getDate().toString()
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Link
      to={`/events/${event.id}`}
      className={cn(
        'group flex flex-col rounded-[14px] overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] transition-all duration-200 select-none cursor-pointer',
        className
      )}
    >
      {/* 4:3 Photo or fallback navy gradient with Date Block per DESIGN.md */}
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-[var(--color-brand-navy)] via-[var(--color-brand-navy-mid)] to-[var(--color-primary-deep)] overflow-hidden">
        {/* Date Block Overlay (top-left) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-center justify-center min-w-[54px] px-2 py-1.5 rounded-[6px] bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-[var(--elevation-1)] border border-[var(--color-hairline)]">
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-sunset)]">
            {monthStr}
          </span>
          <span className="text-heading-2 font-display font-bold leading-tight">
            {dayStr}
          </span>
        </div>

        {event.category && (
          <span className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-black/40 backdrop-blur-xs text-white">
            {event.category}
          </span>
        )}

        {/* Subtle decorative graphic */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-105 transition-transform duration-300">
          <Calendar className="w-32 h-32 text-white" />
        </div>
      </div>

      {/* Content block */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors leading-snug mb-2 line-clamp-2">
            {event.title}
          </h3>

          <div className="flex flex-col gap-1.5 text-body-sm text-[var(--color-muted)] mb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
              <span>{timeStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-[var(--color-hairline)]">
          {/* Seat Availability Meter */}
          <SeatMeter
            totalCapacity={event.totalCapacity}
            registeredCount={event.registeredCount}
          />

          {/* Pricing Row: Member price vs Standard price side-by-side */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-money-md font-bold text-[var(--color-ink)]">
                {event.memberPrice === 0 ? 'Free' : formatMoney(event.memberPrice)}
              </span>
              <MemberPriceBadge />
            </div>

            {isMember && event.standardPrice > event.memberPrice ? (
              <span className="text-caption text-[var(--color-muted)] line-through">
                {formatMoney(event.standardPrice)}
              </span>
            ) : !isMember ? (
              <span className="text-caption text-[var(--color-muted)]">
                Standard {formatMoney(event.standardPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
