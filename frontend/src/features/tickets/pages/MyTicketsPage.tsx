import React from 'react'
import { Link } from 'react-router-dom'
import { Ticket as TicketIcon, ArrowLeft } from 'lucide-react'
import { MOCK_TICKETS } from '../../../lib/mockData'
import { TicketStub } from '../../../components/tickets/TicketStub'
import { EmptyState } from '../../../components/feedback/EmptyState'

export const MyTicketsPage: React.FC = () => {
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

      {MOCK_TICKETS.length > 0 ? (
        <div className="space-y-8">
          {MOCK_TICKETS.map((ticket) => (
            <TicketStub key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<TicketIcon className="w-8 h-8" />}
          title="No tickets yet"
          description="Browse campus events and get tickets with your member discount."
          actionLabel="Browse Events"
          onAction={() => {}}
        />
      )}
    </div>
  )
}
