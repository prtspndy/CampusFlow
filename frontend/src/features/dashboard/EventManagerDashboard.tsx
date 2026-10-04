import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsService } from '../../services/events.service';
import { volunteersService } from '../../services/volunteers.service';
import { announcementsService } from '../../services/announcements.service';
import { EventItem } from '../../types/events';
import { VolunteerOpportunity } from '../../types/volunteers';
import { Announcement } from '../../types/announcements';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDateTime, formatDate } from '../../lib/formatters';
import {
  Calendar,
  QrCode,
  HeartHandshake,
  Megaphone,
  PlusCircle,
  Users,
  Sparkles,
} from 'lucide-react';

export function EventManagerDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerOpportunity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [eventsRes, volRes, annRes] = await Promise.allSettled([
          eventsService.listEvents({ limit: 6 }),
          volunteersService.listOpportunities({ limit: 3 }),
          announcementsService.listManaged({ limit: 3 }),
        ]);

        if (isMounted) {
          if (eventsRes.status === 'fulfilled') {
            setEvents(eventsRes.value.events || []);
          }
          if (volRes.status === 'fulfilled') {
            setVolunteers(volRes.value.opportunities || []);
          }
          if (annRes.status === 'fulfilled') {
            setAnnouncements(annRes.value.announcements || []);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const draftCount = events.filter((e) => e.status === 'DRAFT').length;
  const publishedCount = events.filter((e) => e.status === 'PUBLISHED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border/60 light:border-light-border">
        <div>
          <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand" />
            Event Operations Command
          </h1>
          <p className="text-xs text-dark-muted light:text-light-muted mt-0.5">
            Event publishing, attendee rosters, QR ticket scanning, and volunteer coordination
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/events?action=create">
            <Button size="sm" variant="primary">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Create Event
            </Button>
          </Link>
          <Link to="/checkin">
            <Button size="sm" variant="secondary">
              <QrCode className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Check-in Terminal
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-dark-muted font-medium">Published Events</span>
            <div className="text-xl font-headline font-bold text-dark-text tabular-nums light:text-light-text">
              {isLoading ? <Skeleton className="h-6 w-12" /> : publishedCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-dark-muted font-medium">Draft Events</span>
            <div className="text-xl font-headline font-bold text-dark-text tabular-nums light:text-light-text">
              {isLoading ? <Skeleton className="h-6 w-12" /> : draftCount}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-dark-muted font-medium">Active Volunteer Roles</span>
            <div className="text-xl font-headline font-bold text-dark-text tabular-nums light:text-light-text">
              {isLoading ? <Skeleton className="h-6 w-12" /> : volunteers.length}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Managed Events List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand" />
                  Managed Events Directory
                </CardTitle>
                <Link to="/events" className="text-xs text-brand hover:underline font-medium">
                  All Events
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-xs text-dark-muted">
                  No events created yet. Click Create Event to launch your first event.
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-lg bg-dark-canvas border border-dark-border/80 flex flex-col justify-between gap-2 text-xs light:bg-light-elevated light:border-light-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-dark-text text-sm line-clamp-1 light:text-light-text">
                          {event.title}
                        </h4>
                        <p className="text-[11px] text-dark-muted mt-0.5">
                          {formatDateTime(event.startsAt)} • {event.venue}
                        </p>
                      </div>
                      <Badge status={event.status} />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-dark-border/40 light:border-light-border">
                      <div className="flex items-center gap-1.5 text-[11px] text-dark-muted">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-mono">{event.registeredCount}</span>
                        {event.totalCapacity && (
                          <span className="text-dark-muted/60">/ {event.totalCapacity} capacity</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/events/${event.id}/registrations`}>
                          <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2">
                            Roster
                          </Button>
                        </Link>
                        <Link to={`/events/${event.id}`}>
                          <Button size="sm" variant="secondary" className="h-7 text-[11px] px-2.5">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Volunteers & Announcements (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Volunteer Coordination */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  Volunteer Initiatives
                </CardTitle>
                <Link to="/volunteers" className="text-xs text-brand hover:underline font-medium">
                  Manage
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : volunteers.length === 0 ? (
                <div className="text-center py-6 text-xs text-dark-muted">
                  No active volunteer opportunities.
                </div>
              ) : (
                volunteers.map((vol) => (
                  <div
                    key={vol.id}
                    className="p-3 rounded-lg bg-dark-canvas border border-dark-border/60 text-xs flex justify-between items-center light:bg-light-elevated light:border-light-border"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-dark-text truncate light:text-light-text">
                        {vol.title}
                      </div>
                      <div className="text-[11px] text-dark-muted">
                        {vol.registeredCount} / {vol.capacity} slots filled
                      </div>
                    </div>
                    <Badge status={vol.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Announcements Drafts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-cyan-400" />
                  Broadcasts & Announcements
                </CardTitle>
                <Link to="/announcements" className="text-xs text-brand hover:underline font-medium">
                  Create
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : announcements.length === 0 ? (
                <div className="text-center py-6 text-xs text-dark-muted">
                  No broadcast drafts found.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-lg bg-dark-canvas border border-dark-border/60 text-xs flex justify-between items-center light:bg-light-elevated light:border-light-border"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-dark-text truncate light:text-light-text">
                        {ann.title}
                      </div>
                      <div className="text-[11px] text-dark-muted">{formatDate(ann.createdAt)}</div>
                    </div>
                    <Badge status={ann.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
