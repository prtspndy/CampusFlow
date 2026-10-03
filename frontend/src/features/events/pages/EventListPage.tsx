import { EventCard } from '../../../components/cards/EventCard'
import { FilterChips } from '../../../components/forms/FilterChips'
import { SearchPill } from '../../../components/forms/SearchPill'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Calendar } from 'lucide-react'
import { eventApiService, type BackendEvent } from '../services/eventService'
import type { ClubEvent } from '../../../types/models'
import type { EventStatus } from '../../../types/enums'

function toClubEvent(b: BackendEvent): ClubEvent {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    venue: b.venue,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    memberPrice: b.memberPrice,
    standardPrice: b.standardPrice,
    totalCapacity: b.totalCapacity,
    registeredCount: b.registeredCount,
    status: b.status as EventStatus,
    category: b.category || undefined,
    imageUrl: b.imageUrl || undefined,
    isFeatured: b.isFeatured,
  }
}

export const EventListPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    const fetchEvents = async () => {
      setLoading(true)
      try {
        const res = await eventApiService.listEvents({
          search: searchQuery.trim() || undefined,
          category: selectedFilter !== 'ALL' ? selectedFilter : undefined,
        })
        if (!isCancelled && res.events) {
          setEvents(res.events.map(toClubEvent))
        }
      } catch {
        if (!isCancelled) {
          setEvents([])
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void fetchEvents()
    return () => {
      isCancelled = true
    }
  }, [selectedFilter, searchQuery])

  const filterOptions = [
    { value: 'ALL', label: 'All Events', count: events.length },
    { value: 'Gala', label: 'Galas & Formals' },
    { value: 'Tech', label: 'Tech & Hackathons' },
    { value: 'Social', label: 'Social & Mixers' },
  ]

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedFilter === 'ALL' || event.category === selectedFilter
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header section with glanceable question answered in top third */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-micro-uppercase text-[var(--color-sunset)] font-bold tracking-wider">
            Campus Happenings
          </span>
          <h1 className="text-display-lg font-display text-[var(--color-ink)] font-extrabold tracking-tight mt-1">
            Upcoming Events
          </h1>
          <p className="text-body-md text-[var(--color-muted)] mt-1">
            Reserve tickets with exclusive member discounts and live seat meters.
          </p>
        </div>

        <div className="w-full md:w-72">
          <SearchPill
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search events, venues..."
          />
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips
        options={filterOptions}
        selected={selectedFilter}
        onChange={setSelectedFilter}
      />

      {/* Event Grid: 1-col on mobile, 2-col tablet, 3-col desktop */}
      {loading && filteredEvents.length === 0 ? (
        <div className="py-12 text-center text-body-sm text-[var(--color-muted)]">
          Loading events...
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Calendar className="w-6 h-6" />}
          title="No events found"
          description="Try selecting a different filter category or clearing your search term."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedFilter('ALL')
            setSearchQuery('')
          }}
        />
      )}
    </div>
  )
}
export default EventListPage
