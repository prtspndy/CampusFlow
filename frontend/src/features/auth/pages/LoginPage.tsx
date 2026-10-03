import React, { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/forms/FormField'
import { Banner } from '../../../components/feedback/Banner'
import { useAuthStore } from '../../../stores/authStore'
import { isApiError } from '../../../lib/api'
import { ADMIN_CONSOLE_ROLES, type UserRole } from '../../../lib/constants'

function homeFor(role: UserRole): string {
  return ADMIN_CONSOLE_ROLES.includes(role) ? '/admin' : '/member'
}

/** Only allow same-origin paths as a post-login destination. */
function safeNext(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

export const LoginPage: React.FC = () => {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && user) {
    return <Navigate to={next ?? homeFor(user.role)} replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const signedIn = await login(email.trim(), password)
      navigate(next ?? homeFor(signedIn.role), { replace: true })
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 422) {
          setFieldErrors(error.fieldErrors())
        } else if (error.code === 'RATE_LIMITED') {
          setFormError('Too many sign-in attempts. Please wait a few minutes and try again.')
        } else {
          setFormError(error.message)
        }
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-6 space-y-6 animate-in rise-in duration-300">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-[14px] bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] flex items-center justify-center">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-display-lg font-display text-[var(--color-ink)] font-extrabold tracking-tight">
          Welcome back
        </h1>
        <p className="text-body-md text-[var(--color-muted)]">
          Sign in to see your pass, tickets, and member prices.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-[14px] bg-[var(--color-surface)] p-6 md:p-8 border border-[var(--color-hairline)] space-y-5"
      >
        {formError && <Banner variant="warning" message={formError} />}

        <FormField label="Email" htmlFor="login-email" required error={fieldErrors.email}>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@skyline.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hasError={Boolean(fieldErrors.email)}
            required
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password" required error={fieldErrors.password}>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hasError={Boolean(fieldErrors.password)}
            required
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={submitting}
          disabled={!email || !password}
        >
          Sign in
        </Button>

        <p className="text-caption text-[var(--color-muted)] text-center">
          New to the club?{' '}
          <Link
            to={next ? `/join?next=${encodeURIComponent(next)}` : '/join'}
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
