import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { registrationsService } from '../../services/registrations.service';
import { eventsService } from '../../services/events.service';
import { EventItem, EventRegistration } from '../../types/events';
import { parseApiError } from '../../lib/api-errors';
import { formatDateTime, formatPaise } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Users, ArrowLeft, Download, AlertCircle } from 'lucide-react';

export function EventRegistrationsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const [eventData, regData] = await Promise.all([
        eventsService.getEventById(eventId),
        registrationsService.listEventRegistrations(eventId, {
          status: statusFilter || undefined,
        }),
      ]);
      setEvent(eventData);
      setRegistrations(regData.registrations || []);
      setTotal(regData.total || 0);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-xs text-dark-muted hover:text-dark-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border/60 light:border-light-border">
        <div>
          <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" />
            Attendee Roster
          </h1>
          <p className="text-xs text-dark-muted light:text-light-muted mt-0.5">
            {event?.title ? `Confirmed and pending attendees for "${event.title}"` : 'Event Attendees'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/checkin?eventId=${eventId}`}>
            <Button size="sm" variant="primary">
              Open Check-in Scanner
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded bg-status-error-bg border border-status-error-border text-status-error-text text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Roster Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-sm">
              Registered Attendees ({total})
            </CardTitle>

            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-muted">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-light-elevated light:text-light-text"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No Registrations Yet"
                description="No students have registered for this event yet."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Attendee Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Time</TableHead>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <span className="font-semibold text-dark-text light:text-light-text">
                        {reg.user?.name || 'Student'}
                      </span>
                    </TableCell>
                    <TableCell isMono>{reg.user?.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={reg.tier === 'MEMBER' ? 'info' : 'default'}>
                        {reg.tier}
                      </Badge>
                    </TableCell>
                    <TableCell isMono>
                      {reg.amountPaise === 0 ? 'Free' : formatPaise(reg.amountPaise)}
                    </TableCell>
                    <TableCell>
                      <Badge status={reg.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(reg.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
