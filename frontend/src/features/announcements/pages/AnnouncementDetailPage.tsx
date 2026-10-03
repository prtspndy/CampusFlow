import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Megaphone } from 'lucide-react'
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

export const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .get<Announcement>(`/announcements/${id}`, { auth: false })
      .then(setItem)
      .catch((err: unknown) => setError(isApiError(err) ? err.message : 'Announcement not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-body-md text-[var(--color-muted)]">Loading announcement…</p>
  if (!item) {
    return (
      <EmptyState
        icon={<Megaphone className="w-6 h-6" />}
        title="Announcement unavailable"
        description={error ?? 'This bulletin is not published.'}
        action={<Link to="/announcements" className="text-[var(--color-primary)] underline">Back to announcements</Link>}
      />
    )
  }

  return (
    <article className="max-w-3xl mx-auto space-y-4">
      <Link to="/announcements" className="inline-flex items-center gap-1.5 text-body-sm text-[var(--color-primary)]">
        <ArrowLeft className="w-4 h-4" /> All announcements
      </Link>
      <h1 className="text-display-lg font-display font-extrabold">{item.title}</h1>
      <p className="text-caption text-[var(--color-muted)]">
        {item.authorName} · {item.authorRole}
      </p>
      <p className="text-body-md whitespace-pre-line">{item.body}</p>
    </article>
  )
}
