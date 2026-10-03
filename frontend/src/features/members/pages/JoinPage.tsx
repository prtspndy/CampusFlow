import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Check } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/forms/FormField'
import { useAuthStore } from '../../../stores/authStore'
import { formatMoney } from '../../../lib/format'
import { ROLES } from '../../../lib/constants'

export const JoinPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  type PlanId = 'annual' | 'semester' | 'lifetime'
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const plans: Array<{
    id: PlanId
    name: string
    price: number
    duration: string
    recommended: boolean
    perks: string[]
  }> = [
    {
      id: 'annual',
      name: 'Annual Gold Member',
      price: 499,
      duration: 'Valid for 1 full academic year',
      recommended: true,
      perks: [
        'Free admission to general events',
        'Discounted Spring Gala ticket (₹250 vs ₹400)',
        '15% merchandise discount in the club shop',
        'Official scannable digital Member Pass',
      ],
    },
    {
      id: 'semester',
      name: 'Semester Member',
      price: 299,
      duration: 'Valid through current semester',
      recommended: false,
      perks: [
        'Discounted event tickets',
        '10% merchandise discount',
        'Official scannable digital Member Pass',
      ],
    },
    {
      id: 'lifetime',
      name: 'Alumni & Lifetime Pass',
      price: 1499,
      duration: 'Lifetime access & alumni network',
      recommended: false,
      perks: [
        'All Gold member perks permanently',
        'Alumni networking receptions',
        'Name listed in Annual Gala program',
      ],
    },
  ]

  const activePlan = plans.find((p) => p.id === selectedPlan)!

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      const newMemberUser = {
        id: `user-${Date.now()}`,
        name: name,
        email: email,
        studentId: studentId || 'SKY-2026-9021',
        role: ROLES.MEMBER,
        membership: {
          id: `mem-${Date.now()}`,
          userId: `user-${Date.now()}`,
          memberCode: `CF-${Math.floor(1000 + Math.random() * 9000)}-2026`,
          status: 'ACTIVE' as const,
          validUntil: '2027-04-30T23:59:59Z',
          planName: activePlan.name,
          perks: activePlan.perks.slice(0, 3),
        },
      }

      login(newMemberUser, 'token-new-member')
      navigate('/member/pass')
    }, 600)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
          Become an official member
        </span>
        <h1 className="text-display-lg font-display text-[var(--color-ink)] font-extrabold tracking-tight">
          Join Skyline Student Association
        </h1>
        <p className="text-body-lg text-[var(--color-muted)] max-w-xl mx-auto">
          One card for member-only ticket prices, merchandise discounts, and community initiatives.
        </p>
      </div>

      {/* Plan Selection Cards: real buttons so keyboard and screen-reader users can pick a plan */}
      <div
        role="radiogroup"
        aria-label="Membership plan"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-[14px] p-5 border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                isSelected
                  ? 'bg-[var(--color-primary-tint)] border-[var(--color-primary)] shadow-sm'
                  : 'bg-[var(--color-canvas)] border-[var(--color-hairline-strong)] hover:border-[var(--color-primary)]'
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white shadow-xs">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                  {plan.name}
                </h3>
                <p className="text-caption text-[var(--color-muted)] mt-0.5">
                  {plan.duration}
                </p>

                <div className="mt-4 mb-4">
                  <span className="text-money-xl font-bold text-[var(--color-ink)]">
                    {formatMoney(plan.price)}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-[var(--color-hairline)] text-body-sm text-[var(--color-body)]">
                  {plan.perks.map((perk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                      <span className="text-[13px] leading-tight">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3">
                <div
                  className={`w-full py-2 rounded-[10px] text-caption-bold text-center border font-semibold ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'border-[var(--color-hairline-strong)] text-[var(--color-body)]'
                  }`}
                >
                  {isSelected ? 'Selected Plan' : 'Select Plan'}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Member Info Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[14px] bg-[var(--color-surface)] p-6 md:p-8 border border-[var(--color-hairline)] space-y-5"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-hairline)]">
          <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
          <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
            Student Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Full Name" htmlFor="name" required>
            <Input
              id="name"
              placeholder="e.g. Aanya Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Student Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              placeholder="student@skyline.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
        </div>

        <FormField
          label="Student ID Number"
          htmlFor="studentId"
          helperText="Appears on your official digital Member Pass"
        >
          <Input
            id="studentId"
            placeholder="e.g. SKY-2024-8831"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </FormField>

        {/* Single Primary Action per screen */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
          >
            Pay {formatMoney(activePlan.price)} & Activate Pass
          </Button>

          <p className="text-caption text-[var(--color-muted)] text-center mt-3">
            Secure checkout via Razorpay sandbox. Instant Member Pass generation.
          </p>
        </div>
      </form>
    </div>
  )
}
