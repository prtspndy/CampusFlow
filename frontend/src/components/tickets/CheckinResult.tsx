import React, { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react'
import type { TicketStatus } from '../../types/enums'
import { cn } from '../../lib/cn'

export interface CheckinResultProps {
  status: TicketStatus
  holderName?: string
  ticketType?: string
  scannedAtTime?: string
  onDismiss: () => void
  onOverride?: () => void
  onManualLookup?: () => void
}

export const CheckinResult: React.FC<CheckinResultProps> = ({
  status,
  holderName,
  ticketType,
  scannedAtTime,
  onDismiss,
  onOverride,
  onManualLookup,
}) => {
  useEffect(() => {
    // If valid, auto dismiss after 1.5 seconds per DESIGN.md
    if (status === 'VALID') {
      const timer = setTimeout(() => {
        onDismiss()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [status, onDismiss])

  const bgStyles = {
    VALID: 'bg-[var(--color-checkin-valid)] text-white',
    USED: 'bg-[var(--color-checkin-used)] text-white',
    INVALID: 'bg-[var(--color-checkin-invalid)] text-white',
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col justify-between p-6 select-none animate-in fade-in duration-150',
        bgStyles[status]
      )}
    >
      {/* Top action to dismiss early */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onDismiss}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 hover:bg-black/40 text-white font-medium text-caption cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Resume Scanner</span>
        </button>
        <span className="text-caption font-bold tracking-widest uppercase opacity-80">
          Door Check-in Result
        </span>
      </div>

      {/* Main Center Message */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        {status === 'VALID' && (
          <>
            <CheckCircle2 className="w-24 h-24 mb-6 stroke-[2]" />
            <h1 className="text-checkin-result font-display font-extrabold tracking-tight mb-2">
              Valid Ticket
            </h1>
            <p className="text-heading-2 font-display opacity-95">
              Welcome in, {holderName || 'Guest'}
            </p>
            {ticketType && (
              <span className="mt-3 px-4 py-1 rounded-full bg-white/20 text-body-md font-semibold">
                {ticketType}
              </span>
            )}
          </>
        )}

        {status === 'USED' && (
          <>
            <AlertTriangle className="w-24 h-24 mb-6 stroke-[2]" />
            <h1 className="text-checkin-result font-display font-extrabold tracking-tight mb-2">
              Already Used
            </h1>
            <p className="text-heading-3 font-display opacity-90 max-w-xs">
              Scanned at {scannedAtTime || 'earlier today'}
            </p>
            {holderName && (
              <p className="text-body-md mt-2 opacity-80">Holder: {holderName}</p>
            )}
          </>
        )}

        {status === 'INVALID' && (
          <>
            <XCircle className="w-24 h-24 mb-6 stroke-[2]" />
            <h1 className="text-checkin-result font-display font-extrabold tracking-tight mb-2">
              Invalid Ticket
            </h1>
            <p className="text-heading-3 font-display opacity-90 max-w-xs">
              Ticket code was not found in attendee list
            </p>
          </>
        )}
      </div>

      {/* Bottom Buttons (56px min per DESIGN.md) */}
      <div className="flex flex-col gap-3 max-w-md w-full mx-auto">
        {status === 'USED' && onOverride && (
          <button
            type="button"
            onClick={onOverride}
            className="w-full h-14 rounded-[10px] bg-white text-[var(--color-checkin-used)] font-bold text-body-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Let in anyway (Log override)
          </button>
        )}

        {status === 'INVALID' && onManualLookup && (
          <button
            type="button"
            onClick={onManualLookup}
            className="w-full h-14 rounded-[10px] bg-white text-[var(--color-checkin-invalid)] font-bold text-body-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Manual Name Lookup
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="w-full h-14 rounded-[10px] bg-black/25 text-white border border-white/30 font-bold text-body-md hover:bg-black/40 transition-colors cursor-pointer"
        >
          Scan Next Ticket
        </button>
      </div>
    </div>
  )
}
