import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Award, ShieldCheck, Sparkles } from 'lucide-react'
import type { Membership } from '../../types/models'
import { StatusBadge } from '../badges/StatusBadge'
import { Banner } from '../feedback/Banner'
import { cn } from '../../lib/cn'

export interface MemberPassProps {
  membership: Membership
  memberName: string
  studentId?: string
  onRenew?: () => void
  className?: string
}

export const MemberPass: React.FC<MemberPassProps> = ({
  membership,
  memberName,
  studentId,
  onRenew,
  className,
}) => {
  const isExpiring = membership.status === 'EXPIRING'
  const isExpired = membership.status === 'EXPIRED'

  const formattedDate = new Date(membership.validUntil).toLocaleDateString(
    'en-US',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  )

  const statusVariant =
    membership.status === 'ACTIVE'
      ? 'active'
      : membership.status === 'EXPIRING'
      ? 'expiring'
      : 'expired'

  return (
    <div className={cn('flex flex-col gap-4 max-w-sm w-full mx-auto select-none', className)}>
      {isExpiring && (
        <Banner
          variant="warning"
          title="Membership expiring soon"
          message={`Your pass expires on ${formattedDate}. Renew now to keep your member discounts.`}
          action={onRenew ? { label: 'Renew pass', onClick: onRenew } : undefined}
        />
      )}

      {/* Signature Member Pass Card */}
      <div className="relative overflow-hidden rounded-[20px] bg-[var(--color-brand-navy)] text-white shadow-[var(--elevation-3)] border border-white/10">
        {/* 6px Sunset Accent Stripe across top */}
        <div className="h-1.5 w-full bg-[var(--color-sunset)]" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[var(--color-sunset)]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-caption font-bold tracking-wide uppercase text-white/80 block">
                  Skyline Student Assoc.
                </span>
                <span className="text-[12px] text-white/60">Official Member Pass</span>
              </div>
            </div>

            <StatusBadge
              variant={statusVariant}
              label={
                membership.status === 'ACTIVE'
                  ? 'Active'
                  : membership.status === 'EXPIRING'
                  ? 'Expiring'
                  : 'Expired'
              }
            />
          </div>

          {/* Member Details */}
          <div className="mb-6">
            <span className="text-micro-uppercase text-white/60 font-bold tracking-wider block mb-1">
              Member
            </span>
            <h2 className="text-heading-2 font-display text-white font-bold tracking-tight">
              {memberName}
            </h2>
            <div className="flex items-center gap-2 text-caption text-white/70 mt-1 font-mono">
              <span className="text-code text-white/90">{membership.memberCode}</span>
              {studentId && <span>• ID: {studentId}</span>}
            </div>
          </div>

          {/* Scannable QR Tile on pure white tile per DESIGN.md */}
          <div className="relative flex flex-col items-center justify-center p-4 bg-white rounded-[14px] shadow-sm my-4">
            <QRCodeSVG
              value={membership.memberCode}
              size={170}
              level="H"
              marginSize={0}
            />
            <span className="text-ticket-code text-[var(--color-brand-navy)] font-mono mt-2 font-bold tracking-widest">
              {membership.memberCode}
            </span>

            {isExpired && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] rounded-[14px] flex flex-col items-center justify-center p-4 text-center">
                <span className="text-body-md-medium text-white font-bold mb-1">
                  Pass Expired
                </span>
                <span className="text-caption text-white/80 mb-3">
                  Renew to unlock your pass
                </span>
                {onRenew && (
                  <button
                    type="button"
                    onClick={onRenew}
                    className="px-4 py-1.5 rounded-[10px] bg-[var(--color-sunset)] text-white text-caption font-bold cursor-pointer"
                  >
                    Renew Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Perks & Expiry */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-caption text-white/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[var(--color-sunset)]" />
                <span>{membership.planName}</span>
              </span>
              <span>Valid until {formattedDate}</span>
            </div>

            {membership.perks && membership.perks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {membership.perks.map((perk, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[var(--color-sunset)]" />
                    {perk}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
