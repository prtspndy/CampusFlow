import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { SeatMeter } from '../../../components/data-display/SeatMeter'
import { MemberPriceBadge } from '../../../components/badges/MemberPriceBadge'
import { TicketStub } from '../../../components/tickets/TicketStub'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Banner } from '../../../components/feedback/Banner'
import { formatMoney } from '../../../lib/format'
import { isApiError } from '../../../lib/api'
import { useAuthStore } from '../../../stores/authStore'
import { eventApiService, type BackendEvent } from '../services/eventService'
import { ticketApiService } from '../../tickets/services/ticketService'
import { paymentApiService, loadRazorpayScript } from '../../payments/services/paymentService'
import type { ClubEvent, Ticket } from '../../../types/models'
import type { EventStatus } from '../../../types/enums'

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

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<ClubEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let isCancelled = false

    const loadEvent = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const liveEvent = await eventApiService.getEvent(id)
        if (!isCancelled && liveEvent) {
          setEvent(toClubEvent(liveEvent))
        }
      } catch (err) {
        if (!isCancelled) {
          setEvent(null)
          if (isApiError(err) && err.status === 404) {
            setFetchError('Event not found')
          } else {
            setFetchError(isApiError(err) ? err.message : 'Failed to load event details.')
          }
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void loadEvent()
    return () => {
      isCancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        <span className="text-body-sm text-[var(--color-muted)]">Loading event details...</span>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
        <EmptyState
          icon={<Calendar className="w-6 h-6" />}
          title={fetchError || 'Event not found'}
          description="This event may have ended or the link is out of date."
          action={
            <Link to="/events">
              <Button variant="primary">See upcoming events</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return <EventDetail event={event} />
}

const EventDetail: React.FC<{ event: ClubEvent }> = ({ event }) => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const [purchasedTicket, setPurchasedTicket] = useState<Ticket | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const isMember = Boolean(user?.membership && user.membership.status === 'ACTIVE')
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

  const handleBuyTicket = async () => {
    setActionError(null)
    setActionNotice(null)

    if (status !== 'authenticated' || !user) {
      navigate(`/login?next=${encodeURIComponent(`/events/${event.id}`)}`)
      return
    }

    setIsProcessing(true)

    try {
      // 1. Register for the event via backend API
      const regResponse = await eventApiService.registerForEvent(event.id)

      if (regResponse.ticket) {
        // Free event or membership waiver -> ticket issued immediately!
        let qrPayload = `https://campusflow.skyline.edu/tickets/${regResponse.ticket.id}`
        try {
          const qrData = await ticketApiService.getTicketQr(regResponse.ticket.id)
          qrPayload = qrData.qrToken || qrData.qrDataUrl || qrPayload
        } catch {
          // Non-blocking fallback
        }

        const issuedTicket: Ticket = {
          id: regResponse.ticket.id,
          eventId: event.id,
          eventTitle: event.title,
          eventDate: `${formattedDate}, ${timeStr}`,
          eventVenue: event.venue,
          holderName: user.name,
          holderEmail: user.email,
          ticketType: isMember ? 'Member' : 'General',
          ticketCode: `CF-${regResponse.ticket.id.slice(-6).toUpperCase()}`,
          qrPayload,
          status: 'VALID',
          pricePaid: ticketPrice,
        }
        setPurchasedTicket(issuedTicket)
      } else if (
        regResponse.registration.status === 'PENDING_PAYMENT' ||
        regResponse.registration.status === 'PENDING'
      ) {
        // Paid event -> registration reserved pending payment
        try {
          const orderRes = await paymentApiService.createPaymentOrder(regResponse.registration.id)
          const payment = orderRes.payment

          // Ensure Razorpay checkout script is loaded
          await loadRazorpayScript()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rzp = (window as any).Razorpay
          if (rzp && payment.razorpayOrderId && payment.keyId) {
            const options = {
              key: payment.keyId,
              amount: payment.amountPaise,
              currency: payment.currency,
              name: 'CampusFlow',
              description: `Ticket: ${event.title}`,
              order_id: payment.razorpayOrderId,
              modal: {
                ondismiss: () => {
                  setActionNotice('Checkout closed. Your registration is reserved pending payment.')
                  setIsProcessing(false)
                },
              },
              handler: async (response: {
                razorpay_order_id: string
                razorpay_payment_id: string
                razorpay_signature: string
              }) => {
                setIsProcessing(true)
                try {
                  const verified = await paymentApiService.verifyPayment(response)
                  const confirmedTicket: Ticket = {
                    id: verified.ticket.id,
                    eventId: event.id,
                    eventTitle: event.title,
                    eventDate: `${formattedDate}, ${timeStr}`,
                    eventVenue: event.venue,
                    holderName: user.name,
                    holderEmail: user.email,
                    ticketType: isMember ? 'Member' : 'General',
                    ticketCode: `CF-${verified.ticket.id.slice(-6).toUpperCase()}`,
                    qrPayload:
                      verified.ticket.qrToken || verified.ticket.qrDataUrl || verified.ticket.id,
                    status: 'VALID',
                    pricePaid: ticketPrice,
                  }
                  setPurchasedTicket(confirmedTicket)
                  setActionNotice(null)
                  setActionError(null)
                } catch (verifyErr) {
                  setActionError(
                    isApiError(verifyErr)
                      ? verifyErr.message
                      : 'Payment verification failed. Please contact support.',
                  )
                } finally {
                  setIsProcessing(false)
                }
              },
              prefill: {
                name: user.name,
                email: user.email,
              },
              theme: {
                color: '#3b82f6',
              },
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const instance = new rzp(options)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            instance.on('payment.failed', (failResponse: any) => {
              setActionError(
                failResponse?.error?.description ||
                  'Payment was declined or failed. Please try again.',
              )
              setIsProcessing(false)
            })
            instance.open()
          } else {
            // Live payment provider sandbox is pending configuration on server
            setActionNotice(
              `Registration reserved! Order #${payment.id.slice(0, 8)} created for ${formatMoney(
                payment.amountPaise / 100,
              )}. Payment gateway credentials are required for card settlement.`,
            )
            setIsProcessing(false)
          }
        } catch (paymentErr) {
          if (isApiError(paymentErr) && paymentErr.status === 503) {
            setActionNotice(
              'Registration reserved! Payment provider is currently in sandbox setup. Please try completing payment shortly.',
            )
          } else {
            setActionError(
              isApiError(paymentErr)
                ? paymentErr.message
                : 'Failed to create payment order. Please try again.',
            )
          }
          setIsProcessing(false)
        }
      }
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 409 || err.code === 'ALREADY_REGISTERED') {
          setActionError('You are already registered for this event. Check your passbook.')
        } else if (err.status === 400 && err.message.includes('capacity')) {
          setActionError('This event is now at maximum capacity.')
        } else {
          setActionError(err.message || 'Unable to register for event. Please try again.')
        }
      } else {
        setActionError('Network error connecting to CampusFlow server.')
      }
    } finally {
      setIsProcessing(false)
    }
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

            {/* Notifications / Errors */}
            {actionError && (
              <Banner variant="warning" message={actionError} />
            )}
            {actionNotice && (
              <Banner variant="info" message={actionNotice} />
            )}

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
                <Button variant="secondary" fullWidth disabled>
                  Sold Out
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  isLoading={isProcessing}
                  onClick={handleBuyTicket}
                >
                  {ticketPrice > 0 ? `Buy Ticket • ${formatMoney(ticketPrice)}` : 'Register Free'}
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
export default EventDetailPage
