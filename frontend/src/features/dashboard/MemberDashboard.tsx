import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventsService } from '../../services/events.service';
import { membershipsService } from '../../services/memberships.service';
import { announcementsService } from '../../services/announcements.service';
import { ticketsService } from '../../services/tickets.service';
import { ordersService } from '../../services/orders.service';
import { volunteersService } from '../../services/volunteers.service';
import { reimbursementsService } from '../../services/reimbursements.service';
import { EventItem } from '../../types/events';
import { Membership } from '../../types/membership';
import { Announcement } from '../../types/announcements';
import { Ticket } from '../../types/ticketing';
import { Order } from '../../types/commerce';
import { VolunteerRegistration } from '../../types/volunteers';
import { Reimbursement } from '../../types/finance';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDateTime, formatINR } from '../../lib/formatters';
import {
  Calendar,
  CreditCard,
  Megaphone,
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  QrCode,
  ShoppingBag,
  HeartHandshake,
  Receipt,
  Download,
  AlertTriangle,
  Radio,
  FileCheck,
} from 'lucide-react';

export function MemberDashboard() {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [mySignups, setMySignups] = useState<VolunteerRegistration[]>([]);
  const [myReimbursements, setMyReimbursements] = useState<Reimbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [eventsRes, membersRes, annRes, ticketsRes, ordersRes, signupsRes, reimbRes] = await Promise.allSettled([
          eventsService.listEvents({ limit: 2, status: 'PUBLISHED' }),
          membershipsService.getMyMemberships(),
          announcementsService.listPublished({ limit: 1 }),
          ticketsService.getMyTickets({ limit: 1 }),
          ordersService.getMyOrders({ limit: 1 }),
          volunteersService.getMySignups(),
          reimbursementsService.getMyReimbursements(),
        ]);

        if (isMounted) {
          if (eventsRes.status === 'fulfilled') setUpcomingEvents(eventsRes.value.events || []);
          if (membersRes.status === 'fulfilled') setMemberships(membersRes.value || []);
          if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.announcements || []);
          if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value.tickets || []);
          if (ordersRes.status === 'fulfilled') setMyOrders(ordersRes.value.orders || []);
          if (signupsRes.status === 'fulfilled') setMySignups(signupsRes.value || []);
          if (reimbRes.status === 'fulfilled') setMyReimbursements(reimbRes.value || []);
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

  const activePass = memberships.find((m) => m.status === 'ACTIVE') || memberships[0];
  const activeTicket = tickets[0];
  const activeAlert = announcements[0];

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar matching stitch_student_portal.png */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-headline font-bold text-[#d4e4fa] tracking-tight light:text-slate-900">
              Welcome back, {user?.name || 'Student'}
            </h1>
            <span className="text-xl">👋</span>
            <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded-full border border-[#006e4b]/40">
              • {activePass?.status === 'ACTIVE' ? 'Active Member' : 'Campus Member'}
            </span>
          </div>

          <div className="text-xs text-[#8e8fa3] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 light:text-slate-500">
            <span>SkyID: #{user?.id ? user.id.slice(0, 8).toUpperCase() : 'STUDENT'}</span>
            <span className="text-[#273647]">/</span>
            <span>Account: {user?.email || 'Student Account'}</span>
            <span className="text-[#273647]">/</span>
            <span>Role: {user?.role || 'MEMBER'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-[10px] font-semibold ${activePass?.status === 'ACTIVE' ? 'text-[#4edea3]' : 'text-[#fbbf24]'} bg-[#0d1c2d] px-2 py-0.5 rounded border border-[#273647] flex items-center gap-1 light:bg-slate-100`}>
              <CheckCircle2 className="w-3 h-3" /> {activePass?.status === 'ACTIVE' ? `Active Dues Paid (${activePass.planName || 'Annual'})` : 'Dues Pending'}
            </span>
            <span className="text-[10px] font-semibold text-[#7bd0ff] bg-[#0d1c2d] px-2 py-0.5 rounded border border-[#273647] flex items-center gap-1 light:bg-slate-100">
              <HeartHandshake className="w-3 h-3" /> Volunteer ({mySignups.length} Registered)
            </span>
            <span className="text-[10px] font-semibold text-[#b9c3ff] bg-[#0d1c2d] px-2 py-0.5 rounded border border-[#273647] flex items-center gap-1 light:bg-slate-100">
              <TicketIcon className="w-3 h-3" /> {activeTicket ? (activeTicket.event?.title || 'Pass Reserved') : 'No Active Pass'}
            </span>
          </div>
        </div>

        {/* Right Action Toolbelt */}
        <div className="flex items-center gap-2">
          <Link to="/expenses">
            <Button size="sm" variant="primary" className="h-8 text-xs bg-[#0047FF] hover:bg-[#0038CC] shadow-none">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Submit Expense Claim
            </Button>
          </Link>
          <Link to="/store">
            <Button size="sm" variant="secondary" className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647]">
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-[#7bd0ff]" />
              Browse Merch Store
            </Button>
          </Link>
        </div>
      </section>

      {/* Top 3 Cards Row from Stitch Student Portal */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Digital Student ID (Physical Card Aesthetic) */}
        <div className="rounded-xl bg-gradient-to-br from-[#122131] via-[#0d1c2d] to-[#051424] border border-[#273647]/80 p-5 shadow-sm relative flex flex-col justify-between min-h-[260px] light:from-white light:to-slate-50 light:border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#0047FF] flex items-center justify-center text-white text-xs font-bold">
                CF
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">CampusFlow</span>
                <span className="text-[9px] text-[#8e8fa3] uppercase">Digital Student ID</span>
              </div>
            </div>
            <span className={`text-[10px] font-semibold ${activePass?.status === 'ACTIVE' ? 'text-[#4edea3] bg-[#006e4b]/20 border-[#006e4b]/40' : 'text-[#fbbf24] bg-amber-500/10 border-amber-500/30'} px-2 py-0.5 rounded-full border`}>
              • {activePass ? activePass.status : 'PENDING'}
            </span>
          </div>

          {/* Golden Chip & Contactless Waves */}
          <div className="my-3 flex items-center justify-between">
            <div className="w-10 h-8 rounded bg-gradient-to-tr from-amber-400 to-yellow-200 border border-amber-500/50 shadow-inner flex items-center justify-center">
              <div className="w-6 h-5 border border-amber-600/40 rounded-sm" />
            </div>
            <Radio className="w-5 h-5 text-[#8e8fa3]" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#d4e4fa] light:text-slate-900">
              {user?.name || 'Student Member'}
            </h3>
            <p className="text-[11px] font-mono text-[#8e8fa3] mt-0.5">
              {activePass?.memberCode || `CF-${user?.id ? user.id.slice(0, 8).toUpperCase() : 'USER'}`} {activePass?.validUntil ? `| Exp: ${formatDateTime(activePass.validUntil).split(',')[0]}` : ''}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-[#273647]/50">
            <span className="text-[9px] uppercase tracking-wider text-[#8e8fa3] font-semibold">
              Included Perks & Grants
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {activePass?.perks && activePass.perks.length > 0 ? (
                activePass.perks.slice(0, 3).map((perk, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#7bd0ff] font-medium border border-[#273647]">
                    {perk}
                  </span>
                ))
              ) : (
                <>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#7bd0ff] font-medium border border-[#273647]">
                    Merch Discount
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c2b3c] text-[#4edea3] font-medium border border-[#273647]">
                    Event Access
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Barcode graphic at bottom */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#273647]/40 text-[9px] text-[#8e8fa3] font-mono">
            <span>||| | | |||| || | ||||| | ||</span>
            <span>SEC-NFC-ENABLED</span>
          </div>
        </div>

        {/* Card 2: Confirmed Event Pass with Real QR */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm flex flex-col justify-between min-h-[260px] light:bg-white light:border-slate-200">
          {activeTicket ? (
            <>
              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-[#8e8fa3] uppercase tracking-wider">
                    Confirmed Pass <span className="text-[#4edea3]">• {activeTicket.status}</span>
                  </span>
                  <span className="font-mono text-[#8e8fa3]">#{activeTicket.id.slice(0, 8).toUpperCase()}</span>
                </div>

                <h3 className="text-sm font-bold text-[#d4e4fa] mt-1.5 light:text-slate-900">
                  {activeTicket.event?.title || 'Campus Event'}
                </h3>
                <p className="text-[11px] text-[#8e8fa3] mt-0.5">
                  {activeTicket.event?.venue || 'Campus Venue'} • {activeTicket.event?.startsAt ? formatDateTime(activeTicket.event.startsAt) : 'TBA'}
                </p>
              </div>

              {/* QR Code section */}
              <div className="my-3 flex items-center gap-4 p-3 bg-[#0d1c2d] rounded-lg border border-[#273647]/50 light:bg-slate-50">
                <div className="w-20 h-20 bg-white p-1.5 rounded-lg flex items-center justify-center shrink-0">
                  {activeTicket.qrDataUrl ? (
                    <img src={activeTicket.qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-full h-full text-slate-900" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-[10px] text-[#8e8fa3] uppercase font-semibold">Pass Type</div>
                  <div className="font-bold text-[#4edea3] text-xs uppercase">{activeTicket.tier || 'MEMBER PASS'}</div>
                  <div className="text-[10px] text-[#8e8fa3] pt-1">Pass ID:</div>
                  <div className="text-[10px] font-mono text-[#7bd0ff] truncate max-w-[140px]">
                    {activeTicket.qrToken ? `${activeTicket.qrToken.slice(0, 16)}...` : activeTicket.id.slice(0, 12)}
                  </div>
                </div>
              </div>

              <Link to="/tickets">
                <Button size="sm" variant="secondary" className="w-full h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647]">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  View All Tickets
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-[#8e8fa3] uppercase tracking-wider">Event Pass</span>
                  <span className="text-[#8e8fa3]">STANDBY</span>
                </div>
                <h3 className="text-sm font-bold text-[#d4e4fa] mt-1.5 light:text-slate-900">
                  No Active Event Passes
                </h3>
                <p className="text-[11px] text-[#8e8fa3] mt-0.5">
                  You haven't reserved tickets for any upcoming events yet.
                </p>
              </div>

              <div className="my-4 py-6 text-center text-xs text-[#8e8fa3] bg-[#0d1c2d] rounded-lg border border-[#273647]/50 light:bg-slate-50">
                <TicketIcon className="w-8 h-8 text-[#8e8fa3] mx-auto opacity-40 mb-1" />
                <p className="text-xs text-[#d4e4fa] font-medium light:text-slate-800">Ready for campus life?</p>
                <p className="text-[10px]">Explore upcoming workshops, formals, and seminars.</p>
              </div>

              <Link to="/events">
                <Button size="sm" variant="secondary" className="w-full h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647]">
                  Browse Event Calendar
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Card 3: Broadcast Alert + Semester Engagement */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm flex flex-col justify-between min-h-[260px] light:bg-white light:border-slate-200">
          {/* Top: Broadcast Alert */}
          {activeAlert ? (
            <div className="p-3 rounded-lg bg-[#0d1c2d] border border-[#fbbf24]/30 light:bg-amber-50/50">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold uppercase tracking-wider text-[#fbbf24] flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" /> Broadcast Alert
                </span>
                <span className="text-[#8e8fa3]">{formatDateTime(activeAlert.createdAt).split(',')[0]}</span>
              </div>
              <h4 className="text-xs font-bold text-[#d4e4fa] mt-1 light:text-slate-900 truncate">
                {activeAlert.title}
              </h4>
              <p className="text-[11px] text-[#8e8fa3] mt-1 line-clamp-2">
                {activeAlert.body}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50 text-center">
              <Megaphone className="w-5 h-5 text-[#8e8fa3] mx-auto opacity-40 mb-1" />
              <p className="text-xs font-medium text-[#d4e4fa] light:text-slate-800">No new announcements</p>
              <p className="text-[10px] text-[#8e8fa3]">You're caught up with all campus communications.</p>
            </div>
          )}

          {/* Bottom: Semester Engagement */}
          <div className="pt-3 border-t border-[#273647]/50 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-[#8e8fa3] font-semibold">
              Semester Engagement
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
                <div className="text-base font-bold font-mono text-[#4edea3]">
                  {mySignups.filter((s) => s.status === 'ATTENDED').length} / {mySignups.length}
                </div>
                <div className="text-[10px] text-[#8e8fa3]">Volunteer Attended</div>
              </div>
              <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
                <div className="text-base font-bold font-mono text-[#7bd0ff]">
                  {tickets.length}
                </div>
                <div className="text-[10px] text-[#8e8fa3]">Event Tickets</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-[#8e8fa3]">Membership Status</span>
              <span className={`font-semibold ${activePass?.status === 'ACTIVE' ? 'text-[#4edea3]' : 'text-[#fbbf24]'}`}>
                {activePass?.status === 'ACTIVE' ? 'Active in Good Standing' : 'Standard Account'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom 3 Cards Row from Stitch Student Portal */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: My Merch Orders */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm flex flex-col justify-between min-h-[280px] light:bg-white light:border-slate-200">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#d4e4fa] flex items-center gap-2 light:text-slate-900">
                <ShoppingBag className="w-4 h-4 text-[#7bd0ff]" />
                My Merch Orders
              </h3>
              <span className="text-[10px] text-[#8e8fa3]">
                {myOrders.length > 0 ? `${myOrders.length} Order${myOrders.length > 1 ? 's' : ''}` : 'No Active Orders'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e8fa3] mt-0.5">
              Track official apparel & pickup orders.
            </p>

            {myOrders.length > 0 ? (
              <div className="mt-3 p-3 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 light:bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8e8fa3]">
                    #{myOrders[0].id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded border border-[#006e4b]/40">
                    {myOrders[0].status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900">
                  {myOrders[0].items?.map((item) => `${item.quantity}x ${item.product?.name || 'Merch Item'}`).join(', ') || 'Campus Apparel'}
                </p>
                <div className="text-[11px] text-[#8e8fa3] flex items-center justify-between">
                  <span>Order Total</span>
                  <span className="font-mono text-[#4edea3] font-bold">
                    {formatINR(myOrders[0].totalAmount)}
                  </span>
                </div>
                <div className="text-[10px] text-[#8e8fa3] pt-1 border-t border-[#273647]/40">
                  Placed on {formatDateTime(myOrders[0].createdAt)}
                </div>
              </div>
            ) : (
              <div className="mt-3 p-4 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 light:bg-slate-50 text-center space-y-1">
                <ShoppingBag className="w-6 h-6 text-[#8e8fa3] mx-auto opacity-40 mb-1" />
                <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900">No active merch orders</p>
                <p className="text-[10px] text-[#8e8fa3]">Explore official club hoodies, shirts, and gear.</p>
              </div>
            )}
          </div>

          <Link to="/store" className="pt-3">
            <Button size="sm" variant="secondary" className="w-full h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647]">
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-[#7bd0ff]" />
              Browse Club Store
            </Button>
          </Link>
        </div>

        {/* Card 2: Volunteer Shifts */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm flex flex-col justify-between min-h-[280px] light:bg-white light:border-slate-200">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#d4e4fa] flex items-center gap-2 light:text-slate-900">
                <HeartHandshake className="w-4 h-4 text-[#4edea3]" />
                Volunteer Shifts
              </h3>
              <span className="text-[10px] font-semibold text-[#4edea3]">
                {mySignups.length > 0 ? `${mySignups.length} Registered` : '0 Shifts'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e8fa3] mt-0.5">
              Signed up organizational commitments & logistics.
            </p>

            {mySignups.length > 0 ? (
              <div className="mt-3 p-3 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 light:bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded">
                    {mySignups[0].status}
                  </span>
                  <span className="text-[10px] text-[#8e8fa3]">Confirmed</span>
                </div>
                <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900">
                  {mySignups[0].opportunity?.title || 'Volunteer Assignment'}
                </p>
                <div className="text-[11px] text-[#8e8fa3] flex items-center justify-between">
                  <span>Location</span>
                  <span className="text-[#7bd0ff]">{mySignups[0].opportunity?.location || 'Campus'}</span>
                </div>
                <div className="pt-2 border-t border-[#273647]/40 text-[10px] text-[#8e8fa3]">
                  Scheduled for {mySignups[0].opportunity?.startsAt ? formatDateTime(mySignups[0].opportunity.startsAt) : 'TBA'}
                </div>
              </div>
            ) : (
              <div className="mt-3 p-4 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 light:bg-slate-50 text-center space-y-1">
                <HeartHandshake className="w-6 h-6 text-[#8e8fa3] mx-auto opacity-40 mb-1" />
                <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900">No shifts scheduled</p>
                <p className="text-[10px] text-[#8e8fa3]">Support upcoming club events to earn volunteer recognition.</p>
              </div>
            )}
          </div>

          <Link to="/volunteers" className="pt-3">
            <Button size="sm" variant="secondary" className="w-full h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647]">
              View All Opportunities
            </Button>
          </Link>
        </div>

        {/* Card 3: Reimbursement Hub */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm flex flex-col justify-between min-h-[280px] light:bg-white light:border-slate-200">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#d4e4fa] flex items-center gap-2 light:text-slate-900">
                <Receipt className="w-4 h-4 text-[#7bd0ff]" />
                Reimbursement Hub
              </h3>
              <span className="text-[10px] font-semibold text-[#4edea3]">
                {myReimbursements.length > 0 ? `${myReimbursements.length} Claims` : '0 Claims'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e8fa3] mt-0.5">
              Student out-of-pocket receipts with direct payout.
            </p>

            {myReimbursements.length > 0 ? (
              <div className="mt-3 p-3 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 light:bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded">
                    {myReimbursements[0].status}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#4edea3]">
                    {formatINR(myReimbursements[0].amount)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900 truncate">
                  {myReimbursements[0].notes || 'Out-of-pocket expense claim'}
                </p>
                <div className="text-[10px] text-[#8e8fa3] pt-1 border-t border-[#273647]/40">
                  Submitted {formatDateTime(myReimbursements[0].createdAt)}
                </div>
              </div>
            ) : (
              <div className="mt-3 p-4 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 light:bg-slate-50 text-center space-y-1">
                <Receipt className="w-6 h-6 text-[#8e8fa3] mx-auto opacity-40 mb-1" />
                <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900">No expense claims filed</p>
                <p className="text-[10px] text-[#8e8fa3]">Purchased items for club events? Submit a receipt for reimbursement.</p>
              </div>
            )}
          </div>

          <Link to="/expenses" className="pt-3">
            <Button size="sm" variant="primary" className="w-full h-8 text-xs bg-[#0047FF] hover:bg-[#0038CC] shadow-none">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              New Out-of-Pocket Claim
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
