import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'
import { MOCK_EVENTS } from '../../../lib/mockData'
import { Button } from '../../../components/ui/Button'
import { SeatMeter } from '../../../components/data-display/SeatMeter'
import { MemberPriceBadge } from '../../../components/badges/MemberPriceBadge'
import { TicketStub } from '../../../components/tickets/TicketStub'
import { formatMoney } from '../../../lib/format'
import { useAuthStore } from '../../../stores/authStore'
import type { Ticket } from '../../../types/models'

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [purchasedTicket, setPurchasedTicket] = useState<Ticket | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const event = MOCK_EVENTS.find((e) => e.id === id) || MOCK_EVENTS[0]
  const isMember = !!user?.membership && user.membership.status === 'ACTIVE'
  const ticketPrice = isMember ? event.memberPrice : event.standardPrice
  const isSoldOut = event.registeredCount >= event.totalCapacity

  const dateObj = new Date(event.startsAt)
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const handleBuyTicket = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      const newTicket: Ticket = {
        id: `tick-${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: `${formattedDate}, ${timeStr}`,
        eventVenue: event.venue,
        holderName: user?.name || 'Aanya Patel',
        holderEmail: user?.email || 'aanya.patel@skyline.edu',
        ticketType: isMember ? 'Member' : 'General',
        ticketCode: `SKY-${Math.floor(1000 + Math.random() * 9000)}-${isMember ? 'M' : 'G'}`,
        qrPayload: `https://campusflow.skyline.edu/tickets/SKY-VALID`,
        status: 'VALID',
        pricePaid: ticketPrice,
      }
      setPurchasedTicket(newTicket)
    }, 600)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      {/* Confirmation View after purchase */}
      {purchasedTicket ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 rounded-[14px] bg-[var(--color-success-tint)] text-[var(--color-success-deep)] border border-[var(--color-success-deep)]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-heading-4">You're in! Ticket confirmed.</h4>
                <p className="text-caption">
                  Your QR pass is ready for door check-in. A copy was sent to {purchasedTicket.holderEmail}.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPurchasedTicket(null)}
            >
              Order another
            </Button>
          </div>

          <TicketStub ticket={purchasedTicket} />
        </div>
      ) : (
        /* Event Hero & Details View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Photo Header */}
            <div className="relative aspect-[16/9] w-full rounded-[20px] bg-gradient-to-br from-[var(--color-brand-navy)] via-[var(--color-brand-navy-mid)] to-[var(--color-primary-deep)] overflow-hidden shadow-[var(--elevation-2)] border border-[var(--color-hairline)]">
              <div className="absolute top-4 left-4 flex flex-col items-center justify-center min-w-[64px] px-3 py-2 rounded-[10px] bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-md">
                <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-sunset)]">
                  {dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </span>
                <span className="text-heading-1 font-display font-extrabold leading-none mt-0.5">
                  {dateObj.getDate()}
                </span>
              </div>

              {event.category && (
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-caption font-semibold bg-black/40 backdrop-blur-xs text-white">
                  {event.category}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-display-lg font-display font-extrabold text-[var(--color-ink)] tracking-tight leading-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-body-sm text-[var(--color-muted)] mt-4 py-3 border-y border-[var(--color-hairline)]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{timeStr}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{event.venue}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                About this event
              </h3>
              <p className="text-body-md text-[var(--color-body)] leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Ticket Booking Sidebar Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[14px] bg-[var(--color-canvas)] p-6 border border-[var(--color-hairline)] shadow-[var(--elevation-2)] space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-caption text-[var(--color-muted)] font-medium block">
                    {isMember ? 'Your Member Price' : 'Standard Admission'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-money-xl font-bold text-[var(--color-ink)]">
                      {ticketPrice === 0 ? 'Free' : formatMoney(ticketPrice)}
                    </span>
                    {isMember && <MemberPriceBadge />}
                  </div>
                </div>

                {!isMember && (
                  <Link
                    to="/join"
                    className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    Join to save {formatMoney(event.standardPrice - event.memberPrice)}
                  </Link>
                )}
              </div>

              {/* Seat Meter with low warning threshold */}
              <div className="p-3.5 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-hairline)]">
                <SeatMeter
                  totalCapacity={event.totalCapacity}
                  registeredCount={event.registeredCount}
                />
              </div>

              {/* One primary action per screen per DESIGN.md */}
              {isSoldOut ? (
                <Button variant="secondary" fullWidth>
                  Join the waitlist
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  isLoading={isProcessing}
                  onClick={handleBuyTicket}
                >
                  Buy Ticket {ticketPrice > 0 ? `• ${formatMoney(ticketPrice)}` : ''}
                </Button>
              )}

              <p className="text-caption text-[var(--color-muted)] text-center">
                Instant digital ticket stub with QR pass. No extra ticketing fees.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
