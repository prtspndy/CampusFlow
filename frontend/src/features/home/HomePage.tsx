import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/brand/BrandMark';
import { useAuth } from '../../context/AuthContext';
import { eventsService } from '../../services/events.service';
import { volunteersService } from '../../services/volunteers.service';
import { EventItem } from '../../types/events';
import { VolunteerOpportunity } from '../../types/volunteers';
import { formatDateTime } from '../../lib/formatters';
import {
  Calendar,
  Ticket,
  ShoppingBag,
  Megaphone,
  HeartHandshake,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Users,
  Search,
  CheckCircle,
  FileText,
  BadgePercent,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [liveShifts, setLiveShifts] = useState<VolunteerOpportunity[]>([]);

  useEffect(() => {
    let cancelled = false;
    eventsService
      .listEvents({ status: 'PUBLISHED', limit: 2 })
      .then((result) => {
        if (!cancelled) setLiveEvents(result.events || []);
      })
      .catch(() => {
        if (!cancelled) setLiveEvents([]);
      });
    volunteersService
      .listOpportunities({ status: 'PUBLISHED', limit: 2 })
      .then((result) => {
        if (!cancelled) setLiveShifts(result.opportunities || []);
      })
      .catch(() => {
        if (!cancelled) setLiveShifts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col w-full pb-16 space-y-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0d1c2d] border border-[#273647]/80 p-8 md:p-12 shadow-sm light:bg-white light:border-slate-200">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0047ff]/20 border border-[#0047ff]/40 text-[#7bd0ff] text-xs font-semibold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            Section A • Operations System
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline text-[#d4e4fa] leading-tight light:text-slate-900">
            The Operating System for <span className="text-[#7bd0ff] light:text-blue-600">Student Organizations</span>
          </h1>

          <p className="text-sm md:text-base text-[#c4c5da] leading-relaxed max-w-2xl light:text-slate-600">
            Unifying event lifecycle management, cryptographic QR tickets, membership passes,
            merchandise storefronts, volunteer rosters, and automated treasury accounting into a single high-performance ERP.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <span>Open Workspace ({user?.roleDisplayName || user?.role})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0047ff] hover:bg-[#0047ff]/90 text-white font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link to="/register">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1c2b3c] hover:bg-[#273647] text-[#d4e4fa] border border-[#273647] font-semibold text-xs transition-all light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-800 light:border-slate-200"
                  >
                    <span>Create Account</span>
                  </button>
                </Link>
              </>
            )}
            <Link to="/events">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#122131] hover:bg-[#1c2b3c] text-[#c4c5da] hover:text-[#d4e4fa] text-xs font-medium transition-colors light:bg-white light:hover:bg-slate-50 light:text-slate-600 light:hover:text-slate-900 light:border light:border-slate-200"
              >
                <span>Explore Events</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Feature Quick Stats Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#273647]/60 light:border-slate-200">
          <div className="space-y-0.5">
            <div className="text-xl font-bold font-mono text-[#d4e4fa] light:text-slate-900">4 Roles</div>
            <div className="text-[11px] text-[#8e8fa3] font-medium light:text-slate-500">Fine-Grained RBAC</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-bold font-mono text-[#7bd0ff] light:text-blue-600">100% Real API</div>
            <div className="text-[11px] text-[#8e8fa3] font-medium light:text-slate-500">Production Backend</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-bold font-mono text-[#4edea3] light:text-emerald-600">QR Fast Pass</div>
            <div className="text-[11px] text-[#8e8fa3] font-medium light:text-slate-500">Door Ticket Scanner</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-bold font-mono text-[#b9c3ff] light:text-indigo-600">ERP Ledger</div>
            <div className="text-[11px] text-[#8e8fa3] font-medium light:text-slate-500">Treasury & Claims</div>
          </div>
        </div>
      </section>

      {/* Dual-Mode Interface Showcase (Replicating screen5_hero.png) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-xl font-bold font-headline text-[#d4e4fa] light:text-slate-900">
              High-Density Dual Mode Experience
            </h2>
            <p className="text-xs text-[#c4c5da] light:text-slate-600">
              Engineered for seamless transition between executive dark mode and student mobile light view.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#4edea3] bg-[#006e4b]/20 px-2.5 py-1 rounded-full border border-[#006e4b]/40 self-start sm:self-auto">
            Stitch Screen Reference Match
          </span>
        </div>

        {/* Split Window Mockup */}
        <div className="rounded-xl overflow-hidden border border-[#273647] grid grid-cols-1 lg:grid-cols-2 shadow-lg">
          {/* Left: Dark Theme Dashboard */}
          <div className="bg-[#051424] p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-[#273647]">
            <div className="flex items-center justify-between pb-3 border-b border-[#273647]">
              <div className="flex items-center gap-2">
                <BrandMark className="w-5 h-5" />
                <span className="font-bold text-xs text-[#d4e4fa]">CampusFlow Executive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 px-2.5 rounded bg-[#122131] border border-[#273647] text-[11px] text-[#8e8fa3] flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-[#8e8fa3]" />
                  <span>Search events...</span>
                </div>
                <button
                  type="button"
                  className="h-7 px-2.5 rounded bg-[#0047ff] text-white text-[11px] font-semibold"
                >
                  Create Event
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[#8e8fa3] font-semibold block">
                Upcoming Events & Door Passes
              </span>
              <div className="space-y-2">
                {liveEvents.length === 0 ? (
                  <p className="text-[11px] text-[#8e8fa3]">No published events yet.</p>
                ) : (
                  liveEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg bg-[#122131] border border-[#273647]/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#d4e4fa] block">
                          {event.title}
                        </span>
                        <span className="text-[10px] text-[#8e8fa3]">
                          {formatDateTime(event.startsAt)} • {event.venue}
                        </span>
                      </div>
                      <Link
                        to={`/events/${event.id}`}
                        className="px-2.5 py-1 rounded bg-[#0047ff] text-white text-[10px] font-semibold"
                      >
                        Register Now
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#273647]/40">
              <span className="text-[11px] uppercase tracking-wider text-[#8e8fa3] font-semibold block">
                Open Volunteer Shifts
              </span>
              <div className="grid grid-cols-2 gap-2">
                {liveShifts.length === 0 ? (
                  <p className="col-span-2 text-[11px] text-[#8e8fa3]">No open shifts yet.</p>
                ) : (
                  liveShifts.map((shift) => (
                    <Link
                      key={shift.id}
                      to="/volunteers"
                      className="p-2.5 rounded-lg bg-[#122131] border border-[#273647]/50 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-[#d4e4fa] block">{shift.title}</span>
                        <span className="text-[10px] text-[#8e8fa3]">{shift.registeredCount} signed up</span>
                      </div>
                      <span className="text-[10px] text-[#7bd0ff]">View</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Light Theme Member & Quick Actions View */}
          <div className="bg-[#f8fafc] p-5 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BrandMark className="w-5 h-5" />
                <span className="font-bold text-xs text-slate-900">Member Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Rahul K.</span>
                <Link
                  to="/events"
                  className="h-7 px-2.5 rounded bg-[#0047ff] text-white text-[11px] font-semibold flex items-center"
                >
                  Create Event
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Quick Actions
                </span>
                <div className="space-y-1.5">
                  <Link
                    to="/fundraisers"
                    className="w-full py-1.5 px-3 rounded bg-[#0047ff] hover:bg-[#003ad1] text-white text-xs font-medium block text-center"
                  >
                    Submit Proposal
                  </Link>
                  <Link
                    to="/treasury"
                    className="w-full py-1.5 px-3 rounded bg-[#0047ff] hover:bg-[#003ad1] text-white text-xs font-medium block text-center"
                  >
                    Request Funds
                  </Link>
                  <Link
                    to="/tickets"
                    className="w-full py-1.5 px-3 rounded bg-[#0047ff] hover:bg-[#003ad1] text-white text-xs font-medium block text-center"
                  >
                    My RSVPs
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                    My Profile Snippet
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                      R
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        Rahul Sharma
                      </span>
                      <span className="text-[10px] text-slate-500">9 activity points</span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/memberships"
                  className="mt-3 py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 text-[#0047ff] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Digital Membership Card</span>
                </Link>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Recent Announcements
              </span>
              <div className="p-2.5 rounded bg-white border border-slate-200 text-xs space-y-0.5">
                <span className="font-semibold text-slate-900 block">Campus Cleanup Day</span>
                <p className="text-[11px] text-slate-600 line-clamp-1">
                  Registration open for volunteers. Equipment provided at North Quad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrated Organization Modules */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold font-headline text-[#d4e4fa] light:text-slate-900">
            Integrated Organization Modules
          </h2>
          <p className="text-xs text-[#c4c5da] light:text-slate-600">
            Everything your student body, leadership board, and advisors need to operate at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1 */}
          <div className="p-5 rounded-xl bg-[#122131] border border-[#273647]/60 shadow-sm flex flex-col justify-between hover:border-[#273647] transition-all light:bg-white light:border-slate-200 light:hover:border-slate-300">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#0047ff]/20 text-[#b9c3ff] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">Events & Conferences</h3>
              <p className="text-xs text-[#c4c5da] leading-relaxed light:text-slate-600">
                Discover workshops, speaker sessions, and annual fests. Complete registration flows with Razorpay payment verification.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#273647]/40 light:border-slate-200">
              <Link
                to="/events"
                className="text-xs font-semibold text-[#7bd0ff] hover:underline inline-flex items-center gap-1"
              >
                <span>Browse Events</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 2 */}
          <div className="p-5 rounded-xl bg-[#122131] border border-[#273647]/60 shadow-sm flex flex-col justify-between hover:border-[#273647] transition-all light:bg-white light:border-slate-200 light:hover:border-slate-300">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#00a6e0]/20 text-[#7bd0ff] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">Digital Passes & Door Scanner</h3>
              <p className="text-xs text-[#c4c5da] leading-relaxed light:text-slate-600">
                Cryptographic single-use QR ticketing with real-time gate validation and attendance audit trails.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#273647]/40 light:border-slate-200">
              <Link
                to="/tickets"
                className="text-xs font-semibold text-[#7bd0ff] hover:underline inline-flex items-center gap-1"
              >
                <span>View My Passes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 3 */}
          <div className="p-5 rounded-xl bg-[#122131] border border-[#273647]/60 shadow-sm flex flex-col justify-between hover:border-[#273647] transition-all light:bg-white light:border-slate-200 light:hover:border-slate-300">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#006e4b]/20 text-[#4edea3] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">Merch Drops & Stock Matrix</h3>
              <p className="text-xs text-[#c4c5da] leading-relaxed light:text-slate-600">
                Campus merchandise catalog with real-time stock matrix (S/M/L/XL), member pickup locker PINs, and automated orders.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#273647]/40 light:border-slate-200">
              <Link
                to="/store"
                className="text-xs font-semibold text-[#7bd0ff] hover:underline inline-flex items-center gap-1"
              >
                <span>Visit Store</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 4 */}
          <div className="p-5 rounded-xl bg-[#122131] border border-[#273647]/60 shadow-sm flex flex-col justify-between hover:border-[#273647] transition-all light:bg-white light:border-slate-200 light:hover:border-slate-300">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#0047ff]/20 text-[#b9c3ff] flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">Announcements Broadcast Engine</h3>
              <p className="text-xs text-[#c4c5da] leading-relaxed light:text-slate-600">
                Multi-channel broadcast engine targeting members, volunteers, and attendees with live markdown preview and audit logging.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#273647]/40 light:border-slate-200">
              <Link
                to="/announcements"
                className="text-xs font-semibold text-[#7bd0ff] hover:underline inline-flex items-center gap-1"
              >
                <span>Broadcast Engine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 5 */}
          <div className="p-5 rounded-xl bg-[#122131] border border-[#273647]/60 shadow-sm flex flex-col justify-between hover:border-[#273647] transition-all light:bg-white light:border-slate-200 light:hover:border-slate-300">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#00a6e0]/20 text-[#7bd0ff] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">Volunteer Roster & Dispatch</h3>
              <p className="text-xs text-[#c4c5da] leading-relaxed light:text-slate-600">
                Shift signups, table booth schedules, baking commitments, and attendance confirmation for seamless event staffing.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#273647]/40 light:border-slate-200">
              <Link
                to="/volunteers"
                className="text-xs font-semibold text-[#7bd0ff] hover:underline inline-flex items-center gap-1"
              >
                <span>Volunteer Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 6 */}
          <div className="p-5 rounded-xl bg-[#122131] border border-[#273647]/60 shadow-sm flex flex-col justify-between hover:border-[#273647] transition-all light:bg-white light:border-slate-200 light:hover:border-slate-300">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#006e4b]/20 text-[#4edea3] flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">Treasurer Ledger & Audit Vault</h3>
              <p className="text-xs text-[#c4c5da] leading-relaxed light:text-slate-600">
                Double-entry treasury ledger, dues tracking, out-of-pocket reimbursement claims, and tamper-resistant audit sign-off.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#273647]/40 light:border-slate-200">
              <Link
                to="/treasury"
                className="text-xs font-semibold text-[#7bd0ff] hover:underline inline-flex items-center gap-1"
              >
                <span>View Treasury Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
