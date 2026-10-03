import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, MapPin, Ticket as TicketIcon } from 'lucide-react'
import type { Ticket } from '../../types/models'
import { Button } from '../ui/Button'
import { formatMoney } from '../../lib/format'
import { cn } from '../../lib/cn'

export interface TicketStubProps {
  ticket: Ticket
  className?: string
  onAddToAppleWallet?: () => void
  onAddToGoogleWallet?: () => void
}

export const TicketStub: React.FC<TicketStubProps> = ({
  ticket,
  className,
  onAddToAppleWallet,
  onAddToGoogleWallet,
}) => {
  return (
    <div className={cn('flex flex-col gap-4 max-w-sm w-full mx-auto select-none', className)}>
      <div className="relative overflow-hidden rounded-[20px] bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-[var(--elevation-2)]">
        {/* Top Portion: Event & Attendee Info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-[var(--color-tint-peach)] text-[var(--color-tint-peach-deep)]">
              <TicketIcon className="w-3.5 h-3.5" />
              <span>{ticket.ticketType} Admission</span>
            </span>
            <span className="text-money-md font-bold text-[var(--color-ink)]">
              {formatMoney(ticket.pricePaid)}
            </span>
          </div>

          <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)] leading-snug mb-3">
            {ticket.eventTitle}
          </h3>

          <div className="flex flex-col gap-1.5 text-body-sm text-[var(--color-body)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span>{ticket.eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span>{ticket.eventVenue}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--color-hairline)] flex justify-between items-center text-caption">
            <div>
              <span className="text-[var(--color-muted)] block text-[11px] uppercase tracking-wider font-semibold">
                Attendee
              </span>
              <span className="font-semibold text-[var(--color-ink)]">
                {ticket.holderName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[var(--color-muted)] block text-[11px] uppercase tracking-wider font-semibold">
                Status
              </span>
              <span className="font-semibold text-[var(--color-success-deep)]">
                {ticket.status === 'VALID' ? 'Confirmed' : ticket.status}
              </span>
            </div>
          </div>
        </div>

        {/* Perforation Line with Inward Side Notches */}
        <div className="relative w-full flex items-center py-2">
          {/* Left Semicircular Notch */}
          <div className="absolute -left-3 w-6 h-6 rounded-full bg-[var(--color-surface)] border-r border-[var(--color-hairline)] z-10" />

          {/* Dashed Perforation Line */}
          <div className="w-full border-b-2 border-dashed border-[var(--color-hairline-strong)]" />

          {/* Right Semicircular Notch */}
          <div className="absolute -right-3 w-6 h-6 rounded-full bg-[var(--color-surface)] border-l border-[var(--color-hairline)] z-10" />
        </div>

        {/* Bottom Portion: QR Scannable Stub */}
        <div className="p-6 bg-[var(--color-surface)] flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-white rounded-[12px] shadow-sm mb-3">
            <QRCodeSVG
              value={ticket.qrPayload || ticket.ticketCode}
              size={140}
              level="H"
              marginSize={0}
            />
          </div>

          <span className="text-micro-uppercase text-[var(--color-muted)] mb-1 font-bold">
            Scan for Entry
          </span>
          <span className="text-ticket-code font-mono font-bold tracking-widest text-[var(--color-ink)]">
            {ticket.ticketCode}
          </span>
        </div>
      </div>

      {/* Wallet Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onAddToAppleWallet}
          className="text-caption font-semibold"
        >
          Apple Wallet
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAddToGoogleWallet}
          className="text-caption font-semibold"
        >
          Google Wallet
        </Button>
      </div>
    </div>
  )
}
