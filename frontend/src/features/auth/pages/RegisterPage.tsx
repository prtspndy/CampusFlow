import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Lock, Mail, User as UserIcon, Eye, EyeOff, AlertCircle, Check, CheckCircle2 } from 'lucide-react'
import { ApiError } from '../../../lib/api'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Live password validation
  const hasMinLength = password.length >= 8
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const isPasswordValid = hasMinLength && hasLetter && hasNumber

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (!name.trim()) {
      setLocalError('Please enter your full name')
      return
    }
    if (!email.trim()) {
      setLocalError('Please enter your campus email')
      return
    }
    if (!isPasswordValid) {
      setLocalError('Password must meet all complexity requirements')
      return
    }

    try {
      const user = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      setSuccessMsg(`Account created successfully! Welcome to CampusFlow, ${user.name}.`)
      setTimeout(() => {
        navigate('/member', { replace: true })
      }, 600)
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === 'CONFLICT') {
        setLocalError('An account with this email already exists. Please sign in instead.')
      } else {
        const msg = err instanceof Error ? err.message : 'Registration failed'
        setLocalError(msg)
      }
    }
  }

  const activeError = localError || error

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-[var(--color-surface)]">
      <div className="max-w-[460px] w-full">
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
            Create Member Account
          </h1>
          <p className="font-body text-body-md text-[var(--color-muted)] mt-1.5">
            Join the student union, activate digital passes, and access perks
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[20px] p-7 sm:p-8 shadow-[var(--elevation-2)]">
          {/* Error Banner */}
          {activeError && (
            <div className="mb-5 p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-body-sm flex-1">
                <span className="font-semibold">Notice:</span> {activeError}
                {activeError.includes('already exists') && (
                  <div className="mt-1.5">
                    <Link
                      to="/login"
                      className="font-bold underline hover:no-underline text-rose-900 inline-flex items-center gap-1"
                    >
                      Click here to Sign In →
                    </Link>
                  </div>
                )}
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
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block font-body text-body-sm font-semibold text-[var(--color-ink)] mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (activeError) setLocalError(null)
                  }}
                  autoComplete="name"
                  required
                  className="pl-11"
                  hasError={!!activeError}
                />
                <UserIcon className="w-5 h-5 text-[var(--color-muted)] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

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
                  placeholder="ada@skyline.edu"
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
              <label
                htmlFor="password"
                className="block font-body text-body-sm font-semibold text-[var(--color-ink)] mb-1.5"
              >
                Create Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (activeError) setLocalError(null)
                  }}
                  autoComplete="new-password"
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

              {/* Password criteria checklist */}
              <div className="mt-2.5 p-3 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-hairline)] space-y-1.5 text-[12px] font-medium">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasMinLength ? 'text-emerald-700' : 'text-[var(--color-muted)]'
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'opacity-30'}`}
                  />
                  <span>At least 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasLetter ? 'text-emerald-700' : 'text-[var(--color-muted)]'
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 ${hasLetter ? 'text-emerald-600' : 'opacity-30'}`}
                  />
                  <span>Contains at least one letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumber ? 'text-emerald-700' : 'text-[var(--color-muted)]'
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-600' : 'opacity-30'}`}
                  />
                  <span>Contains at least one number</span>
                </div>
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
              Complete Registration
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center font-body text-body-sm text-[var(--color-muted)] mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
