import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { ROLES, type UserRole } from '../../../lib/constants'
import { Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const { login, switchRole, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (!email.trim()) {
      setLocalError('Please enter your campus email address')
      return
    }
    if (!password) {
      setLocalError('Please enter your password')
      return
    }

    try {
      const user = await login({ email: email.trim(), password })
      setSuccessMsg(`Welcome back, ${user.name}! Redirecting...`)
      setTimeout(() => {
        if (from !== '/') {
          navigate(from, { replace: true })
        } else if (user.role === ROLES.ADMIN || user.role === ROLES.TREASURER) {
          navigate('/admin', { replace: true })
        } else if (user.role === ROLES.DOOR_STAFF) {
          navigate('/checkin/event-gala-1', { replace: true })
        } else {
          navigate('/member', { replace: true })
        }
      }, 500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      setLocalError(msg)
    }
  }

  // Quick switch for preview demo
  const handleQuickDemo = (role: UserRole) => {
    switchRole(role)
    setSuccessMsg(`Active role set to ${role.toLowerCase()}. Redirecting...`)
    setTimeout(() => {
      if (role === ROLES.ADMIN || role === ROLES.TREASURER) {
        navigate('/admin')
      } else if (role === ROLES.DOOR_STAFF) {
        navigate('/checkin/event-gala-1')
      } else {
        navigate('/member')
      }
    }, 400)
  }

  const activeError = localError || error

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-[var(--color-surface)]">
      <div className="max-w-[440px] w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-[12px] bg-[var(--color-brand-navy)] flex items-center justify-center text-[var(--color-on-primary)] font-heading font-black text-title-sm tracking-tight shadow-[var(--elevation-1)] group-hover:scale-105 transition-transform">
              CF
            </div>
            <span className="font-heading font-bold text-title-md text-[var(--color-ink)] tracking-tight">
              Campus<span className="text-[var(--color-sunset)]">Flow</span>
            </span>
          </Link>
          <h1 className="font-heading text-title-lg font-bold text-[var(--color-ink)] tracking-tight">
            Sign In to CampusFlow
          </h1>
          <p className="font-body text-body-md text-[var(--color-muted)] mt-1.5">
            Access your student organization portal and digital passes
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[20px] p-7 sm:p-8 shadow-[var(--elevation-2)]">
          {/* Error Banner */}
          {activeError && (
            <div className="mb-5 p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-body-sm">
                <span className="font-semibold">Authentication Notice:</span> {activeError}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-body-sm font-medium">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campus Email */}
            <div>
              <label
                htmlFor="email"
                className="block font-body text-body-sm font-semibold text-[var(--color-ink)] mb-1.5"
              >
                Campus Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="student@skyline.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (activeError) setLocalError(null)
                  }}
                  autoComplete="email"
                  required
                  className="pl-11"
                  hasError={!!activeError}
                />
                <Mail className="w-5 h-5 text-[var(--color-muted)] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block font-body text-body-sm font-semibold text-[var(--color-ink)]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (activeError) setLocalError(null)
                  }}
                  autoComplete="current-password"
                  required
                  className="pl-11 pr-11"
                  hasError={!!activeError}
                />
                <Lock className="w-5 h-5 text-[var(--color-muted)] absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-6 pt-5 border-t border-[var(--color-hairline)]">
            <div className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-sunset)]" />
              <span>Instant Demo Accounts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo(ROLES.MEMBER)}
                className="px-2.5 py-1.5 text-[12px] font-semibold rounded-[8px] border border-[var(--color-hairline)] bg-[var(--color-surface)] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary-deep)] hover:border-[var(--color-primary-border)] transition-colors cursor-pointer text-center"
              >
                👤 Member
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo(ROLES.ADMIN)}
                className="px-2.5 py-1.5 text-[12px] font-semibold rounded-[8px] border border-[var(--color-hairline)] bg-[var(--color-surface)] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary-deep)] hover:border-[var(--color-primary-border)] transition-colors cursor-pointer text-center"
              >
                ⚡ Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo(ROLES.DOOR_STAFF)}
                className="px-2.5 py-1.5 text-[12px] font-semibold rounded-[8px] border border-[var(--color-hairline)] bg-[var(--color-surface)] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary-deep)] hover:border-[var(--color-primary-border)] transition-colors cursor-pointer text-center"
              >
                🎟️ Door Staff
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center font-body text-body-sm text-[var(--color-muted)] mt-6">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
