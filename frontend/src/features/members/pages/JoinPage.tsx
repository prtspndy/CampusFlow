import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Check, UserCheck } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/forms/FormField'
import { Banner } from '../../../components/feedback/Banner'
import { useAuthStore } from '../../../stores/authStore'
import { isApiError } from '../../../lib/api'
import { formatMoney } from '../../../lib/format'
import { membershipApiService } from '../services/membershipService'

type PlanId = 'annual' | 'semester' | 'lifetime'

const PLANS: Array<{
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

/** Mirrors the backend rule so people see the problem before submitting. */
function passwordHint(value: string): string | null {
  if (value.length === 0) return null
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(value)) return 'Add at least one letter.'
  if (!/[0-9]/.test(value)) return 'Add at least one number.'
  return null
}

function safeNext(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

export const JoinPage: React.FC = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const register = useAuthStore((state) => state.register)

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activatingMembership, setActivatingMembership] = useState(false)
  const [membershipNotice, setMembershipNotice] = useState<string | null>(null)

  const activePlan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0]
  const liveHint = passwordHint(password)
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !liveHint

  const handleActivateMembership = async () => {
    setActivatingMembership(true)
    setMembershipNotice(null)
    try {
      await membershipApiService.applyForMembership(selectedPlan)
      await useAuthStore.getState().fetchMembership()
      navigate('/member/pass')
    } catch (err) {
      if (isApiError(err)) {
        setMembershipNotice(err.message)
      } else {
        setMembershipNotice('Failed to apply for membership.')
      }
    } finally {
      setActivatingMembership(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setFormError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate(next ?? '/member', { replace: true })
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 422) {
          setFieldErrors(error.fieldErrors())
        } else if (error.status === 409) {
          setFieldErrors({ email: 'An account with this email already exists. Try signing in.' })
        } else if (error.code === 'RATE_LIMITED') {
          setFormError('Too many attempts from this device. Please wait a few minutes.')
        } else {
          setFormError(error.message)
        }
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-primary)]">
          Become an official member
        </span>
        <h1 className="text-display-lg font-display text-[var(--color-ink)] font-extrabold tracking-tight">
          Join Skyline Student Association
        </h1>
        <p className="text-body-lg text-[var(--color-muted)] max-w-xl mx-auto">
          One account for member-only ticket prices, merchandise discounts, and community
          initiatives.
        </p>
      </div>

      {/* Plan Selection: real buttons so keyboard and screen-reader users can pick a plan */}
      <div
        role="radiogroup"
        aria-label="Membership plan"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {PLANS.map((plan) => {
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
                <p className="text-caption text-[var(--color-muted)] mt-0.5">{plan.duration}</p>

                <div className="mt-4 mb-4">
                  <span className="text-money-xl font-bold text-[var(--color-ink)]">
                    {formatMoney(plan.price)}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-[var(--color-hairline)] text-body-sm text-[var(--color-body)]">
                  {plan.perks.map((perk) => (
                    <div key={perk} className="flex items-start gap-2">
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

      {status === 'authenticated' && user ? (
        <div className="rounded-[14px] bg-[var(--color-surface)] p-6 md:p-8 border border-[var(--color-hairline)] text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-success-tint)] text-[var(--color-success)] flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
              You're signed in as {user.name}
            </h2>
            <p className="text-body-sm text-[var(--color-muted)] mt-1 max-w-md mx-auto">
              {user.membership
                ? `You have an active ${user.membership.planName} pass (${user.membership.memberCode}).`
                : `Apply to activate your ${activePlan.name} and get your digital pass.`}
            </p>
          </div>

          {membershipNotice && <Banner variant="warning" message={membershipNotice} />}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {!user.membership ? (
              <Button
                variant="primary"
                isLoading={activatingMembership}
                onClick={handleActivateMembership}
              >
                Activate {activePlan.name}
              </Button>
            ) : (
              <Link to="/member/pass">
                <Button variant="primary">View My Digital Pass</Button>
              </Link>
            )}
            <Link to="/member">
              <Button variant="secondary">Go to Member Portal</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[14px] bg-[var(--color-surface)] p-6 md:p-8 border border-[var(--color-hairline)] space-y-5"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-hairline)]">
            <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
              Create your account
            </h2>
          </div>

          {formError && <Banner variant="warning" message={formError} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full Name" htmlFor="join-name" required error={fieldErrors.name}>
              <Input
                id="join-name"
                autoComplete="name"
                placeholder="e.g. Aanya Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                hasError={Boolean(fieldErrors.name)}
                required
              />
            </FormField>

            <FormField label="Student Email" htmlFor="join-email" required error={fieldErrors.email}>
              <Input
                id="join-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="student@skyline.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hasError={Boolean(fieldErrors.email)}
                required
              />
            </FormField>
          </div>

          <FormField
            label="Password"
            htmlFor="join-password"
            required
            error={fieldErrors.password ?? liveHint ?? undefined}
            helperText="At least 8 characters with a letter and a number."
          >
            <Input
              id="join-password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hasError={Boolean(fieldErrors.password || liveHint)}
              required
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={!canSubmit}
            >
              Create account
            </Button>

            <p className="text-caption text-[var(--color-muted)] text-center mt-3">
              Creating an account is free. The {activePlan.name} plan ({formatMoney(activePlan.price)})
              can be activated once membership payments launch.
            </p>
            <p className="text-caption text-[var(--color-muted)] text-center mt-2">
              Already a member?{' '}
              <Link
                to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  )
}
