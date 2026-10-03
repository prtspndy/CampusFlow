import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Globe, Mail } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/forms/FormField'
import type { AudienceType } from '../../../types/enums'
import { cn } from '../../../lib/cn'

export const AnnouncementComposer: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<AudienceType>('ALL_MEMBERS')
  const [channels, setChannels] = useState<{ website: boolean; email: boolean }>({
    website: true,
    email: true,
  })
  const [isSending, setIsSending] = useState(false)

  const audienceCounts: Record<AudienceType, { label: string; count: number }> = {
    ALL_MEMBERS: { label: 'All Members', count: 214 },
    VOLUNTEERS: { label: 'Volunteers Crew', count: 28 },
    EVENT_ATTENDEES: { label: 'Spring Gala Attendees', count: 192 },
  }

  const currentCount = audienceCounts[audience].count

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !body) return

    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      alert(`Broadcast sent to ${currentCount} recipients!`)
      navigate('/announcements')
    }, 600)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-lavender-deep)]">
          Broadcast Communications
        </span>
        <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
          Compose Announcement
        </h1>
        <p className="text-body-sm text-[var(--color-muted)] mt-1">
          Publish urgent bulletins directly to member feeds and campus emails.
        </p>
      </div>

      {/* Signature Composer Single Card per DESIGN.md */}
      <form
        onSubmit={handleSend}
        className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 md:p-8 space-y-5 shadow-sm"
      >
        <FormField label="Subject / Announcement Title" htmlFor="title" required>
          <Input
            id="title"
            placeholder="e.g. Venue Change: Annual Spring Gala"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormField>

        {/* Target Audience Segmented Chips */}
        <div className="space-y-2">
          <label className="text-body-sm-medium text-[var(--color-ink)] block">
            Target Audience
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(audienceCounts) as AudienceType[]).map((key) => {
              const item = audienceCounts[key]
              const isSelected = audience === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAudience(key)}
                  className={cn(
                    'px-4 py-2 rounded-full text-body-sm font-semibold transition-colors cursor-pointer select-none',
                    isSelected
                      ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-body)] border border-[var(--color-hairline)] hover:border-[var(--color-ink)]'
                  )}
                >
                  <span>{item.label}</span>
                  <span className="ml-1.5 opacity-70">({item.count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Body Textarea */}
        <FormField label="Message Body" htmlFor="body" required>
          <textarea
            id="body"
            rows={5}
            placeholder="Type your message to the membership..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            className="w-full p-4 rounded-[10px] text-body-md font-body bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline-strong)] focus:outline-none focus:border-2 focus:border-[var(--color-primary)] placeholder:text-[var(--color-subtle)] resize-y min-h-[140px]"
          />
        </FormField>

        {/* Channels Selection */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-hairline)]">
          <label className="text-body-sm-medium text-[var(--color-ink)] block">
            Delivery Channels
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-body-sm text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={channels.website}
                onChange={(e) =>
                  setChannels((c) => ({ ...c, website: e.target.checked }))
                }
                className="w-4 h-4 rounded text-[var(--color-primary)] cursor-pointer"
              />
              <Globe className="w-4 h-4 text-[var(--color-primary)]" />
              <span>CampusFlow Member Feed</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-body-sm text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={(e) =>
                  setChannels((c) => ({ ...c, email: e.target.checked }))
                }
                className="w-4 h-4 rounded text-[var(--color-primary)] cursor-pointer"
              />
              <Mail className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Student University Email</span>
            </label>
          </div>
        </div>

        {/* Primary Send Button with Recipient Count per DESIGN.md */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSending}
            disabled={!title || !body}
            className="flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send to {currentCount} recipients</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
