import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, Calendar } from 'lucide-react'
import { SearchPill } from '../../../components/forms/SearchPill'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { api, isApiError } from '../../../lib/api'

interface Announcement {
  id: string
  title: string
  body: string
  authorName: string
  authorRole: string
  publishedAt: string | null
}

export const AnnouncementFeed: React.FC = () => {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const handle = window.setTimeout(() => {
      setLoading(true)
      const query = search ? `?search=${encodeURIComponent(search)}` : ''
      api
        .get<{ announcements: Announcement[] }>(`/announcements${query}`, {
          auth: false,
          signal: controller.signal,
        })
        .then((data) => setItems(data.announcements))
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            setError(isApiError(err) ? err.message : 'Announcements could not be loaded.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 250)
    return () => {
      controller.abort()
      window.clearTimeout(handle)
    }
  }, [search])

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
        </div>
        <div className="w-full sm:w-64">
          <SearchPill
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search bulletins..."
          />
        </div>
      </div>

      {loading && <p className="text-body-md text-[var(--color-muted)]">Loading announcements…</p>}
      {error && (
        <EmptyState icon={<Megaphone className="w-6 h-6" />} title="Could not load announcements" description={error} />
      )}

      <div className="space-y-6 pt-2">
        {!loading &&
          !error &&
          items.map((item) => {
            const dateStr = new Date(item.publishedAt ?? '').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            return (
              <article key={item.id} className="rounded-[14px] overflow-hidden bg-[var(--color-canvas)] border border-[var(--color-hairline)]">
                <div className="bg-[var(--color-tint-lavender)] text-[var(--color-tint-lavender-deep)] p-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-caption font-semibold">
                    <Megaphone className="w-4 h-4" /> Posted by {item.authorName} ({item.authorRole})
                  </span>
                  <span className="flex items-center gap-1 text-caption">
                    <Calendar className="w-3.5 h-3.5" /> {dateStr}
                  </span>
                </div>
                <div className="p-5 sm:p-6 space-y-3">
                  <h2 className="text-heading-2 font-display font-bold">
                    <Link to={`/announcements/${item.id}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </h2>
                  <p className="text-body-md text-[var(--color-body)] line-clamp-4 whitespace-pre-line">{item.body}</p>
                </div>
              </article>
            )
          })}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon={<Megaphone className="w-6 h-6" />}
            title="No bulletins found"
            description="No published announcements match this search."
            actionLabel="Reset Search"
            onAction={() => setSearch('')}
          />
        )}
      </div>
    </div>
  )
}
