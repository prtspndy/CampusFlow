import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ticket as TicketIcon, ArrowLeft, Loader2 } from 'lucide-react'
import { MOCK_TICKETS } from '../../../lib/mockData'
import { TicketStub } from '../../../components/tickets/TicketStub'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ticketApiService, type BackendTicketWithEvent } from '../services/ticketService'
import { useAuthStore } from '../../../stores/authStore'
import type { Ticket } from '../../../types/models'
import type { TicketStatus } from '../../../types/enums'

function toClientTicket(
  bt: BackendTicketWithEvent,
  userName: string,
  userEmail: string,
  qrPayload?: string,
): Ticket {
  const startDate = bt.event?.startsAt ? new Date(bt.event.startsAt) : new Date(bt.issuedAt)
  const eventDateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

  return {
    id: bt.id,
    eventId: bt.eventId,
    eventTitle: bt.event?.title || 'Campus Event',
    eventDate: eventDateStr,
    eventVenue: bt.event?.venue || 'Campus Hall',
    holderName: userName,
    holderEmail: userEmail,
    ticketType: 'General',
    ticketCode: `CF-${bt.id.slice(-6).toUpperCase()}`,
    qrPayload: qrPayload || `https://campusflow.skyline.edu/tickets/${bt.id}`,
    status: (bt.status === 'ISSUED' ? 'VALID' : bt.status) as TicketStatus,
    pricePaid: (bt.registration?.amountPaise ?? 0) / 100,
  }
}

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    const loadTickets = async () => {
      setLoading(true)
      try {
        const res = await ticketApiService.listOwnTickets()
        if (!isCancelled && res.tickets) {
          if (res.tickets.length > 0) {
            // Load QR codes for issued tickets
            const mapped = await Promise.all(
              res.tickets.map(async (t) => {
                let qr = ''
                try {
                  const qrRes = await ticketApiService.getTicketQr(t.id)
                  qr = qrRes.qrToken || qrRes.qrDataUrl || ''
                } catch {
                  // Ignore QR fetch failure
                }
                return toClientTicket(t, user?.name || 'Attendee', user?.email || '', qr)
              }),
            )
            setTickets(mapped)
          } else {
            setTickets([])
          }
        }
      } catch {
        // Fallback to MOCK_TICKETS if server is offline
        if (!isCancelled) {
          setTickets(MOCK_TICKETS)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void loadTickets()
    return () => {
      isCancelled = true
    }
  }, [user])

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to="/member"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-muted)]">
          My Passbook
        </span>
      </div>

      <div className="text-center">
        <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)]">
          Event Tickets
        </h1>
        <p className="text-caption text-[var(--color-muted)] mt-0.5">
          Show your ticket stub at the door for entry
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
          <span className="text-caption text-[var(--color-muted)]">Loading your passes...</span>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-8">
          {tickets.map((ticket) => (
            <TicketStub key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<TicketIcon className="w-8 h-8" />}
          title="No tickets yet"
          description="Browse campus events and get tickets with your member discount."
          actionLabel="Browse Events"
          onAction={() => navigate('/events')}
        />
      )}
    </div>
  )
}
export default MyTicketsPage
