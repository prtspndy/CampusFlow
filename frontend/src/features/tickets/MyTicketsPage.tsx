import { useState, useEffect } from 'react';
import { ticketsService } from '../../services/tickets.service';
import { Ticket } from '../../types/ticketing';
import { parseApiError } from '../../lib/api-errors';
import { formatDate, formatDateTime } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Ticket as TicketIcon, QrCode, Calendar, MapPin, AlertCircle } from 'lucide-react';

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await ticketsService.getMyTickets();
      setTickets(res.tickets || []);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleOpenQr = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setQrLoading(true);
    try {
      const fullTicket = await ticketsService.getTicketQr(ticket.id);
      setSelectedTicket(fullTicket);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border/60 light:border-light-border">
        <div>
          <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-brand" />
            My Event Passes & QR Tickets
          </h1>
          <p className="text-xs text-dark-muted light:text-light-muted mt-0.5">
            Digital event credentials and scannable door passes
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded bg-status-error-bg border border-status-error-border text-status-error-text text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No Tickets Issued"
          description="You don't have any event tickets yet. Explore upcoming campus events to get passes."
          actionText="Browse Events"
          onAction={() => window.location.assign('/events')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="relative rounded-xl bg-[#122131] border border-[#273647] p-5 space-y-4 overflow-hidden shadow-sm light:bg-white light:border-[#E2E8F0]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                    Pass #{t.id.slice(0, 8)}
                  </span>
                  <h3 className="font-headline font-bold text-base text-dark-text mt-0.5 line-clamp-1 light:text-light-text">
                    {t.event?.title || 'Campus Event'}
                  </h3>
                </div>
                <Badge status={t.status} />
              </div>

              <div className="py-2 border-y border-dark-border/60 text-xs text-dark-muted space-y-1.5 light:border-light-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>{formatDateTime(t.event?.startsAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{t.event?.venue}</span>
                </div>
                {t.checkedInAt && (
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Checked in at {formatDateTime(t.checkedInAt)}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-dark-muted">
                  Issued {formatDate(t.issuedAt)}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  className="h-8 text-xs px-3"
                  onClick={() => handleOpenQr(t)}
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  Show QR Pass
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Pass Modal */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title="Digital Ticket Pass"
          description={selectedTicket.event?.title || 'Official CampusPass'}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              {qrLoading ? (
                <div className="w-52 h-52 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedTicket.qrDataUrl ? (
                <img
                  src={selectedTicket.qrDataUrl}
                  alt="Scannable Pass QR Code"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center p-3 text-slate-800">
                  <QrCode className="w-16 h-16 text-slate-400 mb-2" />
                  <span className="font-mono text-xs break-all">
                    {selectedTicket.qrToken || 'Token Unavailable'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Badge status={selectedTicket.status} />
              <p className="text-[11px] text-dark-muted pt-1">
                Present this scannable QR pass to door staff at the entrance.
              </p>
              <div className="font-mono text-[10px] text-dark-muted">
                Ticket ID: {selectedTicket.id}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setSelectedTicket(null)}
            >
              Close Pass
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
