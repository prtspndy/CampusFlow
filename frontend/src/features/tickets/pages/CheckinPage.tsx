import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ArrowLeft, Users, Flashlight } from 'lucide-react'
import { CheckinResult } from '../../../components/tickets/CheckinResult'
import type { TicketStatus } from '../../../types/enums'

export const CheckinPage: React.FC = () => {
  const [ticketInput, setTicketInput] = useState('')
  const [checkedInCount, setCheckedInCount] = useState(142)
  const totalTickets = 180

  const [activeResult, setActiveResult] = useState<{
    status: TicketStatus
    holderName?: string
    ticketType?: string
    scannedAtTime?: string
  } | null>(null)

  const handleScanCode = (code: string) => {
    const clean = code.trim().toUpperCase()
    if (!clean) return

    if (clean.includes('8831') || clean.includes('VALID') || clean.startsWith('GALA-8831')) {
      setActiveResult({
        status: 'VALID',
        holderName: 'Aanya Patel',
        ticketType: 'Annual Gold Member',
      })
      setCheckedInCount((c) => Math.min(totalTickets, c + 1))
    } else if (clean.includes('4219') || clean.includes('USED') || clean.startsWith('GALA-4219')) {
      setActiveResult({
        status: 'USED',
        holderName: 'Rohan Sharma',
        ticketType: 'General Admission',
        scannedAtTime: '7:42 pm',
      })
    } else {
      setActiveResult({
        status: 'INVALID',
      })
    }
    setTicketInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScanCode(ticketInput)
  }

  return (
    <div className="relative min-h-screen w-full bg-[#0b1020] text-white flex flex-col justify-between p-4 sm:p-6 select-none font-body">
      {/* Result Overlay when a scan is registered */}
      {activeResult && (
        <CheckinResult
          status={activeResult.status}
          holderName={activeResult.holderName}
          ticketType={activeResult.ticketType}
          scannedAtTime={activeResult.scannedAtTime}
          onDismiss={() => setActiveResult(null)}
          onOverride={() => {
            alert('Override recorded in check-in audit log.')
            setCheckedInCount((c) => Math.min(totalTickets, c + 1))
            setActiveResult(null)
          }}
          onManualLookup={() => {
            alert('Opening attendee list search modal...')
            setActiveResult(null)
          }}
        />
      )}

      {/* Pinned Attendance Counter at Top per DESIGN.md */}
      <header className="flex items-center justify-between py-2 border-b border-white/10">
        <Link
          to="/admin/events"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-white text-caption font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Scanner</span>
        </Link>

        {/* Live Attendance Counter */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white">
          <Users className="w-4 h-4 text-[var(--color-sunset)]" />
          <span className="text-body-sm font-bold font-mono">
            {checkedInCount} of {totalTickets} in
          </span>
        </div>

        <button
          type="button"
          onClick={() => alert('Camera torch toggled')}
          className="p-2 rounded-[10px] bg-white/10 hover:bg-white/20 text-white"
          aria-label="Toggle Torch"
        >
          <Flashlight className="w-4 h-4" />
        </button>
      </header>

      {/* Camera Viewfinder Area */}
      <main className="flex-1 flex flex-col items-center justify-center my-6">
        <div className="relative w-full max-w-xs aspect-square rounded-[20px] border-2 border-white/30 bg-black/50 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
          {/* Target Corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[var(--color-primary)] rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-[var(--color-primary)] rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-[var(--color-primary)] rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[var(--color-primary)] rounded-br-lg" />

          {/* Animated Scanning Beam */}
          <div className="absolute inset-x-0 h-1 bg-[var(--color-primary)] shadow-[0_0_15px_var(--color-primary)] animate-pulse" />

          <Camera className="w-12 h-12 text-white/30 mb-2" />
          <span className="text-caption text-white/70 font-medium">
            Point at attendee QR code
          </span>

          {/* Demo quick scan triggers */}
          <div className="absolute bottom-3 inset-x-3 flex justify-between gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => handleScanCode('GALA-8831-V')}
              className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-mono"
            >
              Test Valid
            </button>
            <button
              type="button"
              onClick={() => handleScanCode('GALA-4219-U')}
              className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-mono"
            >
              Test Used
            </button>
            <button
              type="button"
              onClick={() => handleScanCode('INVALID-99')}
              className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-mono"
            >
              Test Invalid
            </button>
          </div>
        </div>
      </main>

      {/* Manual Code Entry Form at Bottom (56px minimum touch targets per DESIGN.md) */}
      <footer className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            placeholder="Or enter ticket code manually..."
            className="flex-1 h-14 px-4 rounded-[10px] bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-body-md font-mono focus:outline-none focus:border-[var(--color-primary)]"
          />
          <button
            type="submit"
            className="h-14 px-6 rounded-[10px] bg-[var(--color-primary)] text-white font-bold text-body-md hover:bg-[var(--color-primary-pressed)] transition-colors cursor-pointer shrink-0"
          >
            Check In
          </button>
        </form>
      </footer>
    </div>
  )
}
