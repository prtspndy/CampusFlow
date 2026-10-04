import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventsService } from '../../services/events.service';
import { EventItem, EventStatus } from '../../types/events';
import { canManageEvents } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatDateTime, formatINR } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Calendar,
  Search,
  MapPin,
  Users,
  Plus,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';

export function EventsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isStaff = canManageEvents(user);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>(isStaff ? '' : 'PUBLISHED');
  const [isLoading, setIsLoading] = useState(true);

  // Create Event Modal
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [category, setCategory] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [memberPrice, setMemberPrice] = useState(0);
  const [standardPrice, setStandardPrice] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState<number | undefined>(undefined);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await eventsService.listEvents({
        page,
        limit: 12,
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      setEvents(res.events || []);
      setTotal(res.total || 0);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedVenue = venue.trim();

    if (trimmedTitle.length < 3) {
      setModalError('Title must be at least 3 characters');
      return;
    }
    if (trimmedDesc.length < 10) {
      setModalError('Description must be at least 10 characters');
      return;
    }
    if (trimmedVenue.length < 2) {
      setModalError('Venue must be at least 2 characters');
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setModalError('Please specify valid start and end dates/times');
      return;
    }

    if (endDate <= startDate) {
      setModalError('End date/time must be strictly after start date/time');
      return;
    }

    setIsCreating(true);

    try {
      const newEvent = await eventsService.createEvent({
        title: trimmedTitle,
        description: trimmedDesc,
        venue: trimmedVenue,
        category: category.trim() || undefined,
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        memberPrice: Number(memberPrice),
        standardPrice: Number(standardPrice),
        totalCapacity: totalCapacity ? Number(totalCapacity) : undefined,
        isFeatured,
      });

      setIsCreateOpen(false);
      resetForm();
      setFeedback({ type: 'success', message: `Event "${newEvent.title}" drafted successfully!` });
      await loadEvents();
    } catch (err) {
      const parsed = parseApiError(err);
      setModalError(parsed.message);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVenue('');
    setCategory('');
    setStartsAt('');
    setEndsAt('');
    setMemberPrice(0);
    setStandardPrice(0);
    setTotalCapacity(undefined);
    setIsFeatured(false);
    setModalError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border/60 light:border-light-border">
        <div>
          <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand" />
            Campus Events & Galas
          </h1>
          <p className="text-xs text-dark-muted light:text-light-muted mt-0.5">
            Discover upcoming club workshops, tech talks, mixers, and cultural fests
          </p>
        </div>

        {isStaff && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setModalError(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Event
          </Button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-status-success-bg border border-status-success-border text-status-success-text'
              : 'bg-status-error-bg border border-status-error-border text-status-error-text'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
            <input
              type="text"
              placeholder="Search event title or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-light-elevated light:text-light-text light:border-light-border"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-muted shrink-0" />
            <input
              type="text"
              placeholder="Filter category (e.g. Tech, Cultural)..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-light-elevated light:text-light-text light:border-light-border"
            />
          </div>

          {isStaff ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EventStatus | '')}
              className="h-9 px-3 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-light-elevated light:text-light-text light:border-light-border"
            >
              <option value="">All Statuses (Staff)</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          ) : (
            <div className="flex items-center text-xs text-dark-muted px-2">
              Showing active campus events ({total})
            </div>
          )}
        </div>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Events Found"
          description={
            search || categoryFilter
              ? 'No campus events match your search criteria. Try a different keyword.'
              : 'There are currently no events scheduled. Check back soon!'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="flex flex-col justify-between overflow-hidden hover:border-brand/60 transition-all group"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {event.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-brand/10 border border-brand/20 text-brand font-semibold uppercase">
                        {event.category}
                      </span>
                    )}
                    {event.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold uppercase flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Featured
                      </span>
                    )}
                  </div>
                  <Badge status={event.status} />
                </div>

                <Link to={`/events/${event.id}`}>
                  <h3 className="font-headline font-bold text-base text-dark-text group-hover:text-brand transition-colors line-clamp-1 light:text-light-text">
                    {event.title}
                  </h3>
                </Link>

                <p className="text-xs text-dark-muted line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-dark-border/40 text-xs text-dark-muted light:border-light-border">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span>{formatDateTime(event.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono">{event.registeredCount} attendees</span>
                    {event.totalCapacity && (
                      <span className="text-dark-muted/60">/ {event.totalCapacity} capacity</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-dark-border/60 bg-dark-canvas/30 flex items-center justify-between gap-3 light:border-light-border light:bg-light-elevated/40">
                <div className="flex flex-col">
                  <span className="text-[10px] text-dark-muted uppercase font-medium">Pricing</span>
                  <div className="text-xs font-semibold text-dark-text light:text-light-text">
                    {event.memberPrice === 0 ? (
                      <span className="text-emerald-400 font-bold">Free for Members</span>
                    ) : (
                      <span>{formatINR(event.memberPrice)} (Members)</span>
                    )}
                  </div>
                </div>

                <Link to={`/events/${event.id}`}>
                  <Button size="sm" variant="primary" className="h-8 text-xs">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Modal (Staff) */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Campus Event"
          description="Draft an official event or workshop for the organization"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            {modalError && (
              <div className="p-3 rounded text-xs font-medium flex items-center gap-2 bg-status-error-bg border border-status-error-border text-status-error-text">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <Input
              label="Event Title"
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. Annual Tech Symposium 2026"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (modalError) setModalError(null);
              }}
            />

            <div>
              <label className="block text-xs font-semibold text-dark-muted light:text-light-muted mb-1.5">
                Description <span className="text-status-error-text">*</span> (min 10 characters)
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={5000}
                placeholder="Detailed event agenda, guest speakers, dress code..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (modalError) setModalError(null);
                }}
                className="w-full px-3 py-2 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-white light:text-light-text light:border-light-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Venue / Room"
                required
                minLength={2}
                maxLength={200}
                placeholder="e.g. Main Auditorium Hall B"
                value={venue}
                onChange={(e) => {
                  setVenue(e.target.value);
                  if (modalError) setModalError(null);
                }}
              />

              <Input
                label="Category"
                placeholder="e.g. Tech, Cultural, Sports"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (modalError) setModalError(null);
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Starts At"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />

              <Input
                label="Ends At"
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Member Price (₹)"
                type="number"
                min="0"
                value={memberPrice}
                onChange={(e) => setMemberPrice(Number(e.target.value))}
                helperText="0 for free admission"
              />

              <Input
                label="Standard Price (₹)"
                type="number"
                min="0"
                value={standardPrice}
                onChange={(e) => setStandardPrice(Number(e.target.value))}
                helperText="Price for non-members"
              />

              <Input
                label="Total Capacity (Optional)"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={totalCapacity || ''}
                onChange={(e) =>
                  setTotalCapacity(e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="isFeatured"
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand"
              />
              <label htmlFor="isFeatured" className="text-xs text-dark-text light:text-light-text font-medium">
                Feature on main organization landing showcase
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-dark-border/60 light:border-light-border">
              <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                Save as Draft
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
