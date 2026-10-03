import React, { useState } from 'react'
import { MOCK_EVENTS } from '../../../lib/mockData'
import { EventCard } from '../../../components/cards/EventCard'
import { FilterChips } from '../../../components/forms/FilterChips'
import { SearchPill } from '../../../components/forms/SearchPill'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Calendar } from 'lucide-react'

export const EventListPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filterOptions = [
    { value: 'ALL', label: 'All Events', count: MOCK_EVENTS.length },
    { value: 'Gala', label: 'Galas & Formals' },
    { value: 'Tech', label: 'Tech & Hackathons' },
    { value: 'Social', label: 'Social & Mixers' },
  ]

  const filteredEvents = MOCK_EVENTS.filter((event) => {
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
      {filteredEvents.length > 0 ? (
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
