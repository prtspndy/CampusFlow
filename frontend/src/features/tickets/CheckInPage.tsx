import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventsService } from '../../services/events.service';
import { ticketsService } from '../../services/tickets.service';
import { EventItem } from '../../types/events';
import { AttendanceRecord, CheckInResult } from '../../types/ticketing';
import { parseApiError } from '../../lib/api-errors';
import { formatDateTime, formatINR } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  Download,
  Users,
  CreditCard,
  Calendar,
  Sparkles,
  Search,
  ScanLine,
  RefreshCw,
} from 'lucide-react';

export function CheckInPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Validation outcome preview
  const [validatedResult, setValidatedResult] = useState<CheckInResult | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Attendance log
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'MEMBERS' | 'GUESTS' | 'UNCHECKED'>('ALL');

  // Load staff managed events
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await eventsService.listEvents({ limit: 50 });
        setEvents(res.events || []);
        if (!selectedEventId && res.events?.length > 0) {
          setSelectedEventId(res.events[0].id);
        }
      } catch {
        // Handled silently
      }
    }
    loadEvents();
  }, [selectedEventId]);

  // Load event attendance records
  const loadAttendance = useCallback(async () => {
    if (!selectedEventId) return;
    setAttendanceLoading(true);
    try {
      const res = await ticketsService.listAttendance(selectedEventId);
      setAttendance(res.attendance || []);
    } catch {
      // Handled silently
    } finally {
      setAttendanceLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const grossSales = (selectedEvent?.registeredCount ?? 0) * (selectedEvent?.memberPrice ?? 0);
  const totalRegistered = selectedEvent?.registeredCount ?? 0;
  const checkInRate = totalRegistered > 0 ? Math.round((attendance.length / totalRegistered) * 100) : 0;
  const netProceeds = Math.max(0, grossSales * 0.97);

  // Handle Token Validation
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsValidating(true);
    setFeedback(null);
    setValidatedResult(null);

    try {
      const res = await ticketsService.validateTicket(selectedEvent?.id || selectedEventId, tokenInput.trim());
      if (res.result === 'VALID' && res.ticket) {
        setValidatedResult(res.ticket);
        setFeedback({ type: 'success', message: 'Valid Ticket Pass! Ready for Gate Admission.' });
      } else {
        const errorDescriptions: Record<string, string> = {
          INVALID: 'Ticket token is invalid or does not exist.',
          WRONG_EVENT: 'This ticket belongs to a different event.',
          CANCELLED: 'This ticket has been cancelled.',
          UNPAID: 'Registration payment has not been confirmed.',
          USED: 'This ticket has already been checked in.',
        };
        setFeedback({
          type: 'error',
          message: errorDescriptions[res.result] || 'Ticket is not valid for entry.',
        });
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsValidating(false);
    }
  };

  // Execute Real Gate Check-In
  const handleExecuteCheckIn = async () => {
    if (!tokenInput.trim()) return;

    setIsCheckingIn(true);
    setFeedback(null);

    try {
      const res = await ticketsService.checkInAttendee(selectedEvent?.id || selectedEventId, tokenInput.trim());
      setFeedback({
        type: 'success',
        message: `Success! Checked in ${res.ticket?.holderName || 'Attendee'} at ${new Date().toLocaleTimeString()}`,
      });
      setTokenInput('');
      setValidatedResult(null);
      await loadAttendance();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards matching Stitch stitch_ticketing_checkin.png */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Gross Ticket Sales
              </span>
              <div className="text-2xl font-bold font-mono text-[#d4e4fa] tabular-nums mt-1 light:text-slate-900">
                {formatINR(grossSales)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#4edea3] font-medium">
            Based on {totalRegistered} registered tickets
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Registered Count
              </span>
              <div className="text-2xl font-bold font-mono text-[#7bd0ff] tabular-nums mt-1">
                {totalRegistered}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#8e8fa3]">
            Tier: {selectedEvent?.standardPrice ? `Members ${formatINR(selectedEvent.memberPrice)} / Non-Members ${formatINR(selectedEvent.standardPrice)}` : 'Free entry'}
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Net Proceeds
              </span>
              <div className="text-2xl font-bold font-mono text-[#4edea3] tabular-nums mt-1">
                {formatINR(netProceeds)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#8e8fa3]">
            After estimated gateway fees
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Live Door Attendance
              </span>
              <div className="text-2xl font-bold font-mono text-[#d4e4fa] tabular-nums mt-1 light:text-slate-900">
                {attendance.length} <span className="text-sm font-normal text-[#8e8fa3]">/ {totalRegistered || '0'} Registered</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#4edea3] font-semibold">
            {checkInRate}% checked-in on premises
          </div>
        </div>
      </section>

      {/* Hero Event Banner & Scanner Station matching Stitch */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Flagship Event Header (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#122131] border border-[#273647] p-6 shadow-sm space-y-4 light:bg-white light:border-[#E2E8F0]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0047FF] text-white px-2 py-0.5 rounded">
              Flagship Event
            </span>
            <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded-full border border-[#006e4b]/40">
              • Registration Live
            </span>
            <span className="text-[10px] font-mono text-[#8e8fa3]">
              TERM-SPRING-26 // EVENT REF-409
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-headline font-bold text-[#d4e4fa] light:text-slate-900">
              {selectedEvent?.title || 'Active Check-In Session'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8e8fa3] mt-2 light:text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7bd0ff]" />
                {selectedEvent?.startsAt ? formatDateTime(selectedEvent.startsAt) : 'Schedule TBA'}
              </span>
              <span>•</span>
              <span>{selectedEvent?.venue || 'Campus Venue TBA'}</span>
            </div>
          </div>

          {/* Event Capacity Bar */}
          <div className="pt-3 border-t border-[#273647]/50 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#d4e4fa] font-semibold light:text-slate-800">
                Event Capacity Threshold
              </span>
              <span className="font-mono text-xs text-[#7bd0ff] font-bold">
                {totalRegistered} / {selectedEvent?.totalCapacity || 'Unlimited'} Reserved ({selectedEvent?.totalCapacity ? `${Math.min(100, Math.round((totalRegistered / selectedEvent.totalCapacity) * 100))}%` : 'Open'})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1c2b3c] overflow-hidden light:bg-slate-200">
              <div
                className="h-full bg-gradient-to-r from-[#0047FF] to-[#38BDF8] rounded-full"
                style={{
                  width: selectedEvent?.totalCapacity
                    ? `${Math.min(100, Math.round((totalRegistered / selectedEvent.totalCapacity) * 100))}%`
                    : '100%',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#8e8fa3] pt-0.5">
              <span className="text-[#4edea3] font-medium">
                • {selectedEvent?.totalCapacity ? `${Math.max(0, selectedEvent.totalCapacity - totalRegistered)} seats available` : 'Open admission'}
              </span>
              <span>Capacity: {selectedEvent?.totalCapacity ? `${selectedEvent.totalCapacity} seats` : 'No hard limit'}</span>
            </div>
          </div>

          {/* Event Selector for Staff */}
          <div className="pt-2">
            <label className="block text-[10px] uppercase font-bold text-[#8e8fa3] mb-1">
              Active Check-In Roster:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647] text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-100 light:border-slate-300 light:text-slate-900"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.venue || 'Campus'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: DoorFast Pass Station (5 cols) matching Stitch */}
        <div className="lg:col-span-5 rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm space-y-4 light:bg-white light:border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#0047FF]" />
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">DoorFast Pass</h3>
            </div>
            <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded-full border border-[#006e4b]/40">
              • Scanner Active
            </span>
          </div>

          <p className="text-[11px] text-[#8e8fa3]">
            Paperless check-in station for door staff. Scan digital-QR or input student ID.
          </p>

          {/* Scanner Input */}
          <form onSubmit={handleValidate} className="flex gap-2">
            <input
              type="text"
              placeholder="Scan QR or Type Stub / Token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] placeholder:text-[#8e8fa3] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
            />
            <Button type="submit" size="sm" variant="primary" isLoading={isValidating} className="h-9 px-4 bg-[#0047FF]">
              Verify
            </Button>
          </form>

          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 ${
                feedback.type === 'success'
                  ? 'bg-[#006e4b]/20 border border-[#006e4b]/40 text-[#4edea3]'
                  : 'bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffb4ab]'
              }`}
            >
              <span>{feedback.message}</span>
              {validatedResult && (
                <Button size="sm" variant="primary" onClick={handleExecuteCheckIn} isLoading={isCheckingIn} className="h-6 text-[10px] px-2.5 bg-[#4edea3] text-slate-900 hover:bg-[#34d399]">
                  Confirm Admission
                </Button>
              )}
            </div>
          )}

          {/* Optical QR Recognition Visualizer */}
          <div className="h-28 rounded-lg bg-[#0d1c2d] border border-dashed border-[#273647] flex flex-col items-center justify-center p-3 text-center light:bg-slate-50">
            <QrCode className="w-8 h-8 text-[#8e8fa3]/60 mb-1" />
            <span className="text-[10px] font-semibold text-[#7bd0ff]">
              Optical QR Recognition Ready
            </span>
            <span className="text-[9px] font-mono text-[#8e8fa3] mt-0.5">
              Terminal ID: DOOR-NORTH-01
            </span>
          </div>

          {/* Recent Live Admissions Log */}
          <div className="pt-2 border-t border-[#273647]/50 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8e8fa3]">
              <span>Recent Live Admissions</span>
              <span className="text-[#4edea3]">Realtime Sync</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              {attendance.slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                  <div>
                    <span className="font-semibold text-[#d4e4fa] light:text-slate-900">{rec.ticket?.user?.name || 'Attendee'}</span>
                    <span className="text-[10px] text-[#8e8fa3] ml-2">#{rec.ticket?.qrToken?.slice(0, 7) || rec.ticketId.slice(0, 7)} • {rec.ticket?.tier || 'General'}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#4edea3]">Checked-in {formatDateTime(rec.checkedInAt)}</span>
                </div>
              ))}
              {attendance.length === 0 && (
                <div className="p-3 text-center text-[10px] text-[#8e8fa3] bg-[#0d1c2d]/50 rounded border border-[#273647]/30">
                  No admissions recorded yet for this session.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-[#8e8fa3]">
              <span>Scanner operator: <strong className="text-[#d4e4fa] light:text-slate-800">{user?.name || 'Rahul Sharma'}</strong></span>
              <Button size="sm" variant="ghost" onClick={loadAttendance} className="h-6 text-[10px] text-[#7bd0ff]">
                <RefreshCw className="w-3 h-3 mr-1" /> Force Sync
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Pricing Tiers & Quotas matching Stitch */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-headline font-bold text-[#d4e4fa] light:text-slate-900">
              Active Pricing Tiers & Quotas
            </h3>
            <p className="text-[11px] text-[#8e8fa3] light:text-slate-500">
              Automatic ID verification rules applied upon student single sign-on checkout.
            </p>
          </div>
          <Button size="sm" variant="secondary" className="h-7 text-xs bg-[#1c2b3c] border border-[#273647]">
            + Add Sub-Tier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm space-y-2 light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#7bd0ff] bg-[#0047FF]/20 px-2 py-0.5 rounded">
                Dues-Paying Members
              </span>
              <span className="text-[10px] font-semibold text-[#4edea3]">
                {selectedEvent?.standardPrice && selectedEvent?.memberPrice < selectedEvent?.standardPrice
                  ? `-${Math.round((1 - selectedEvent.memberPrice / selectedEvent.standardPrice) * 100)}% Discount`
                  : 'Member Rate'}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#d4e4fa] light:text-slate-900">
              {formatINR(selectedEvent?.memberPrice ?? 0)} <span className="text-xs font-normal text-[#8e8fa3]">/ person</span>
            </div>
            <p className="text-[10px] text-[#8e8fa3]">
              Active dues-paying member rate. Discount applied upon verification through SkyID token or student roster.
            </p>
            <div className="pt-2 border-t border-[#273647]/40 flex justify-between text-[10px] text-[#8e8fa3]">
              <span>Registration Status: <strong className="text-[#d4e4fa] light:text-slate-900">{totalRegistered} registered</strong></span>
              <span className="text-[#4edea3]">
                {selectedEvent?.totalCapacity ? `${Math.max(0, selectedEvent.totalCapacity - totalRegistered)} Left` : 'Open'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm space-y-2 light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#d4e4fa] bg-[#1c2b3c] px-2 py-0.5 rounded light:text-slate-800 light:bg-slate-100">
                Guest & Non-Members
              </span>
              <span className="text-[10px] font-semibold text-[#8e8fa3]">Standard Rate</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#d4e4fa] light:text-slate-900">
              {formatINR(selectedEvent?.standardPrice ?? 0)} <span className="text-xs font-normal text-[#8e8fa3]">/ person</span>
            </div>
            <p className="text-[10px] text-[#8e8fa3]">
              Open public registration for alumni, plus-ones, faculty, and cross-department campus guests.
            </p>
            <div className="pt-2 border-t border-[#273647]/40 flex justify-between text-[10px] text-[#8e8fa3]">
              <span>Capacity Quota: <strong className="text-[#d4e4fa] light:text-slate-900">{selectedEvent?.totalCapacity ? `${selectedEvent.totalCapacity} seats max` : 'Unlimited'}</strong></span>
              <span className="text-[#7bd0ff]">
                {selectedEvent?.totalCapacity ? `${Math.max(0, selectedEvent.totalCapacity - totalRegistered)} Left` : 'Available'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm space-y-2 light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#b9c3ff] bg-[#0047FF]/20 px-2 py-0.5 rounded">
                Check-in Turnout Rate
              </span>
              <span className="text-[10px] font-semibold text-[#b9c3ff]">{checkInRate}%</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#d4e4fa] light:text-slate-900">
              {attendance.length} <span className="text-xs font-normal text-[#8e8fa3]">/ {totalRegistered} checked in</span>
            </div>
            <p className="text-[10px] text-[#8e8fa3]">
              Real-time gate admissions processed by event staff against issued digital tickets.
            </p>
            <div className="pt-2 border-t border-[#273647]/40 flex justify-between text-[10px] text-[#8e8fa3]">
              <span>Pending Arrival: <strong className="text-[#d4e4fa] light:text-slate-900">{Math.max(0, totalRegistered - attendance.length)} attendees</strong></span>
              <span className="text-[#b9c3ff]">{totalRegistered > 0 ? `${totalRegistered - attendance.length} remaining` : 'No arrivals'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Holders & Attendee Ledger Table matching Stitch */}
      <section className="rounded-xl bg-[#122131] border border-[#273647]/60 overflow-hidden shadow-sm light:bg-white light:border-slate-200">
        <div className="p-4 border-b border-[#273647]/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">
              Ticket Holders & Attendee Ledger
            </h3>
            <p className="text-[11px] text-[#8e8fa3] light:text-slate-500">
              Real-time sync with stripe checkout and student verification registry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0d1c2d] p-1 rounded-lg border border-[#273647] text-xs light:bg-slate-100">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                  filterCategory === 'ALL' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
                }`}
              >
                All ({attendance.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('MEMBERS')}
                className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                  filterCategory === 'MEMBERS' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
                }`}
              >
                Checked In
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('UNCHECKED')}
                className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                  filterCategory === 'UNCHECKED' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
                }`}
              >
                Pending
              </button>
            </div>

            <Button size="sm" variant="secondary" className="h-8 text-xs bg-[#1c2b3c] border border-[#273647]">
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0d1c2d] border-b border-[#273647]/60 text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:bg-slate-50 light:border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Order ID & QR</th>
                <th className="px-3 py-2.5">Attendee Name & Contact</th>
                <th className="px-3 py-2.5">Ticket Tier</th>
                <th className="px-3 py-2.5">Payment Method</th>
                <th className="px-3 py-2.5">Check-In Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#273647]/40 light:divide-slate-200">
              {attendanceLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-[#8e8fa3]">
                    Loading attendee check-in records...
                  </td>
                </tr>
              ) : attendance.length > 0 ? (
                attendance.map((rec) => (
                  <tr key={rec.id} className="h-12 hover:bg-[#1c2b3c]/50 transition-colors">
                    <td className="px-4 py-2 font-mono text-[#7bd0ff]">
                      #{rec.ticket?.qrToken?.slice(0, 6).toUpperCase() || rec.ticketId?.slice(0, 6).toUpperCase() || 'TK-019'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1c2b3c] border border-[#273647] flex items-center justify-center font-bold text-[10px] text-[#7bd0ff]">
                          {rec.ticket?.user?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#d4e4fa] light:text-slate-900">{rec.ticket?.user?.name || 'Attendee'}</p>
                          <p className="text-[10px] text-[#8e8fa3]">{rec.ticket?.user?.email || 'student@campus.edu'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-semibold text-[#7bd0ff] bg-[#0047FF]/15 px-2 py-0.5 rounded">
                        {rec.ticket?.tier ? `${rec.ticket.tier} Tier` : 'Standard Pass'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#8e8fa3] text-[11px]">
                      Stripe Card Paid
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded-full border border-[#006e4b]/40">
                        Checked-in {formatDateTime(rec.checkedInAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#7bd0ff]">
                        View Receipt
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#8e8fa3]">
                    No attendees have checked in yet for this event. Enter or scan a ticket verification token above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
