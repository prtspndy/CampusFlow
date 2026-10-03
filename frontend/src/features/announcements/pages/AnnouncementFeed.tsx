import { useState } from 'react'
import { Megaphone, Calendar, Eye } from 'lucide-react'
import { MOCK_ANNOUNCEMENTS } from '../../../lib/mockData'
import { SearchPill } from '../../../components/forms/SearchPill'
import { EmptyState } from '../../../components/feedback/EmptyState'

export const AnnouncementFeed: React.FC = () => {
  const [search, setSearch] = useState('')

  const filtered = MOCK_ANNOUNCEMENTS.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.body.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-lavender-deep)]">
            Official Broadcasts
          </span>
          <h1 className="text-display-lg font-display text-[var(--color-ink)] font-extrabold tracking-tight mt-1">
            Announcements
          </h1>
          <p className="text-body-md text-[var(--color-muted)] mt-1">
            Official association updates, general body meetings, and deadlines.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <SearchPill
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search bulletins..."
          />
        </div>
      </div>

      <div className="space-y-6 pt-2">
        {filtered.map((item) => {
          const dateStr = new Date(item.sentAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })

          return (
            <article
              key={item.id}
              className="rounded-[14px] overflow-hidden bg-[var(--color-canvas)] border border-[var(--color-hairline)] shadow-[var(--elevation-1)] select-none"
            >
              {/* Lavender Tint Header per DESIGN.md */}
              <div className="bg-[var(--color-tint-lavender)] text-[var(--color-tint-lavender-deep)] p-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/40 dark:border-purple-800/30">
                <div className="flex items-center gap-2 text-caption font-semibold">
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span>
                    Posted by {item.authorName} ({item.authorRole})
                  </span>
                </div>

                <div className="flex items-center gap-4 text-caption text-[var(--color-tint-lavender-deep)]/80">
                  <span className="flex items-center gap-1 font-mono text-[12px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </span>

                  {/* Sent to 214 · Opened by 171 per DESIGN.md */}
                  <span className="flex items-center gap-1 font-mono text-[12px] font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      Sent to {item.recipientCount} · Opened by {item.openedCount}
                    </span>
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-3">
                <h2 className="text-heading-2 font-display font-bold text-[var(--color-ink)] leading-snug">
                  {item.title}
                </h2>
                <p className="text-body-md text-[var(--color-body)] leading-relaxed whitespace-pre-line">
                  {item.body}
                </p>
              </div>
            </article>
          )
        })}

        {filtered.length === 0 && (
          <EmptyState
            icon={<Megaphone className="w-6 h-6" />}
            title="No bulletins found"
            description="No announcements matching your search query were found."
            actionLabel="Reset Search"
            onAction={() => setSearch('')}
          />
        )}
      </div>
    </div>
  )
}
