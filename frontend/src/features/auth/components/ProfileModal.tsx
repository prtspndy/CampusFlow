import React, { useState } from 'react'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { X, User, Mail, Shield, CheckCircle2, AlertCircle, Edit3, KeyRound } from 'lucide-react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfileName, isLoading, isDemoMode } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  if (!isOpen || !user) return null

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Name cannot be empty' })
      return
    }

    try {
      await updateProfileName(name.trim())
      setFeedback({ type: 'success', message: 'Profile name updated successfully!' })
      setIsEditing(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile'
      setFeedback({ type: 'error', message: msg })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative max-w-lg w-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[20px] shadow-[var(--elevation-3)] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] flex items-center justify-center font-bold text-caption">
              CF
            </div>
            <div>
              <h2 className="font-heading text-title-sm font-bold text-[var(--color-ink)]">
                User Profile
              </h2>
              <p className="text-caption text-[var(--color-muted)]">
                {isDemoMode ? 'Demo Session (Simulated Profile)' : 'Verified Backend Account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {feedback && (
            <div
              className={`p-3 rounded-[10px] flex items-center gap-2 text-body-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* User Avatar & Name Banner */}
          <div className="flex items-center gap-4 p-4 rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-hairline)]">
            <div className="w-14 h-14 rounded-full bg-[var(--color-brand-navy)] text-white flex items-center justify-center font-heading font-black text-title-md shrink-0 shadow-[var(--elevation-1)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-title-sm text-[var(--color-ink)] truncate">
                  {user.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--color-primary-tint)] text-[var(--color-primary-deep)] border border-[var(--color-primary-border)]">
                  {user.role.toLowerCase()}
                </span>
              </div>
              <p className="font-body text-body-sm text-[var(--color-muted)] truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          {/* Edit Name Form */}
          {isEditing ? (
            <form onSubmit={handleSaveName} className="space-y-3 p-4 rounded-[12px] bg-slate-50 border border-slate-200">
              <div className="text-body-sm font-semibold text-[var(--color-ink)]">
                Update Display Name (PATCH /api/auth/me)
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setName(user.name)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Edit Name
              </Button>
            </div>
          )}

          {/* Identity & Technical Specs */}
          <div className="space-y-2.5 text-body-sm border-t border-[var(--color-hairline)] pt-4">
            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--color-muted)] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" /> Account ID:
              </span>
              <code className="text-[12px] font-mono bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-hairline)] text-[var(--color-ink)]">
                {user.id}
              </code>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--color-muted)] flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Email:
              </span>
              <span className="font-medium text-[var(--color-ink)]">{user.email}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--color-muted)] flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Security Role:
              </span>
              <span className="font-semibold text-[var(--color-ink)] uppercase">
                {user.role}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--color-muted)] flex items-center gap-1.5">
                <User className="w-4 h-4" /> Account Status:
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {user.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--color-surface)] border-t border-[var(--color-hairline)] flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
