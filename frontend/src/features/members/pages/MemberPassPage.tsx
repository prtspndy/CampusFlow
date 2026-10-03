import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ticket, ShoppingBag, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { MemberPass } from '../../../components/tickets/MemberPass'
import { EmptyState } from '../../../components/feedback/EmptyState'

export const MemberPassPage: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  if (!user?.membership) {
    return (
      <EmptyState
        icon={<ShieldCheck className="w-8 h-8" />}
        title="No active membership pass"
        description="Join Skyline Student Association to get your official digital pass, member ticket prices, and merch discounts."
        actionLabel="Join Now"
        onAction={() => navigate('/join')}
      />
    )
  }

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div className="text-center">
        <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
          Digital ID
        </span>
        <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)]">
          Member Pass
        </h1>
        <p className="text-caption text-[var(--color-muted)] mt-0.5">
          Scan at the door for fast event entry and verification
        </p>
      </div>

      {/* Signature Pass Component */}
      <MemberPass
        membership={user.membership}
        memberName={user.name}
        studentId={user.studentId}
        onRenew={() => navigate('/join')}
      />

      {/* Member Quick Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          to="/member/tickets"
          className="flex flex-col items-center justify-center p-3.5 rounded-[12px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] hover:border-[var(--color-primary)] transition-colors text-center group"
        >
          <Ticket className="w-5 h-5 text-[var(--color-primary)] mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-body-sm-medium text-[var(--color-ink)] font-semibold">
            My Tickets
          </span>
          <span className="text-[11px] text-[var(--color-muted)]">View stubs</span>
        </Link>

        <Link
          to="/shop"
          className="flex flex-col items-center justify-center p-3.5 rounded-[12px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] hover:border-[var(--color-primary)] transition-colors text-center group"
        >
          <ShoppingBag className="w-5 h-5 text-[var(--color-primary)] mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-body-sm-medium text-[var(--color-ink)] font-semibold">
            Merch Store
          </span>
          <span className="text-[11px] text-[var(--color-muted)]">15% discount</span>
        </Link>
      </div>
    </div>
  )
}
