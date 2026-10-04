import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../services/users.service';
import { membershipsService } from '../../services/memberships.service';
import { eventsService } from '../../services/events.service';
import { financeService } from '../../services/finance.service';
import { fundraisersService } from '../../services/fundraisers.service';
import { expensesService } from '../../services/expenses.service';
import { volunteersService } from '../../services/volunteers.service';
import { productsService } from '../../services/products.service';
import { FinanceSummary, LedgerTransaction } from '../../types/finance';
import { EventItem } from '../../types/events';
import { Fundraiser } from '../../types/fundraisers';
import { VolunteerOpportunity } from '../../types/volunteers';
import { Product } from '../../types/commerce';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatINR, formatDateTime } from '../../lib/formatters';
import {
  Users,
  CreditCard,
  Calendar,
  Landmark,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Download,
  ShoppingBag,
  QrCode,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalMemberships, setTotalMemberships] = useState<number | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<LedgerTransaction[]>([]);
  const [activeFundraiser, setActiveFundraiser] = useState<Fundraiser | null>(null);
  const [operationalTasks, setOperationalTasks] = useState<VolunteerOpportunity[]>([]);
  const [totalTasks, setTotalTasks] = useState<number | null>(null);
  const [featuredMerch, setFeaturedMerch] = useState<Product | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadExecutiveData() {
      try {
        const [usersRes, membersRes, eventsRes, financeRes, txRes, fundRes, volRes, prodRes] = await Promise.allSettled([
          usersService.listUsers(),
          membershipsService.listMemberships({ limit: 1 }),
          eventsService.listEvents({ limit: 4, status: 'PUBLISHED' }),
          financeService.getSummary(),
          financeService.getLedger({ limit: 5 }),
          fundraisersService.listFundraisers({ limit: 1, status: 'ACTIVE' }),
          volunteersService.listOpportunities({ limit: 3, status: 'PUBLISHED' }),
          productsService.listProducts({ limit: 1 }),
        ]);

        if (isMounted) {
          if (usersRes.status === 'fulfilled') setTotalUsers(usersRes.value.length);
          if (membersRes.status === 'fulfilled') setTotalMemberships(membersRes.value.total);
          if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.events || []);
          if (financeRes.status === 'fulfilled') setFinanceSummary(financeRes.value);
          if (txRes.status === 'fulfilled') setRecentTransactions(txRes.value.transactions || []);
          if (fundRes.status === 'fulfilled' && fundRes.value.fundraisers?.length > 0) {
            setActiveFundraiser(fundRes.value.fundraisers[0]);
          }
          if (volRes.status === 'fulfilled') {
            setOperationalTasks(volRes.value.opportunities || []);
            setTotalTasks(volRes.value.total ?? 0);
          }
          if (prodRes.status === 'fulfilled' && prodRes.value.products?.length > 0) {
            setFeaturedMerch(prodRes.value.products[0]);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadExecutiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportLedger = async () => {
    setIsExporting(true);
    try {
      await financeService.downloadLedgerCsv();
    } catch {
      // export error handled
    } finally {
      setIsExporting(false);
    }
  };

  const flagshipEvent = events[0];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Toolbelt (Exact Stitch Header) */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-headline font-bold text-[#d4e4fa] tracking-tight light:text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <span className="text-xl">👋</span>
          </div>
          <p className="text-xs text-[#8e8fa3] mt-0.5 flex items-center gap-2 light:text-slate-500">
            <span>Fall 2026 Term Overview</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#273647]"></span>
            <span className="text-[#7bd0ff] font-medium">CampusFlow Core Deck</span>
          </p>
        </div>

        {/* Quick Action Toolbelt matching Stitch */}
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/announcements">
            <Button size="sm" variant="secondary" className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647] text-[#d4e4fa]">
              <span className="text-[#4edea3] font-bold mr-1.5">+</span>
              Announcement
            </Button>
          </Link>
          <Link to="/memberships">
            <Button size="sm" variant="secondary" className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647] text-[#d4e4fa]">
              <CreditCard className="w-3.5 h-3.5 mr-1.5 text-[#7bd0ff]" />
              Record Cash Dues
            </Button>
          </Link>
          <Link to="/volunteers">
            <Button size="sm" variant="secondary" className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647] text-[#d4e4fa]">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-[#b9c3ff]" />
              New Task
            </Button>
          </Link>
          <Button
            size="sm"
            variant="primary"
            className="h-8 text-xs bg-[#0047FF] hover:bg-[#0038CC] text-white font-semibold shadow-none"
            onClick={handleExportLedger}
            isLoading={isExporting}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Ledger
          </Button>
        </div>
      </section>

      {/* Metric KPI Cards (4 Grid from Stitch) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Members */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Total Active Members
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-headline text-[#d4e4fa] tabular-nums light:text-slate-900">
                  {isLoading ? <Skeleton className="h-7 w-16" /> : totalMemberships ?? 0}
                </span>
                <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-1 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[#8e8fa3] light:text-slate-500">System Accounts</span>
              <span className="font-mono text-[#4edea3] font-semibold">{totalUsers ?? 0} Registered</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1c2b3c] overflow-hidden light:bg-slate-200">
              <div
                className="h-full bg-[#4edea3] rounded-full"
                style={{
                  width: totalUsers && totalUsers > 0 && totalMemberships
                    ? `${Math.min(100, Math.round((totalMemberships / totalUsers) * 100))}%`
                    : '100%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Net Treasury Balance */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Net Treasury Balance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#d4e4fa] tabular-nums light:text-slate-900">
                  {isLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : financeSummary ? (
                    formatINR(financeSummary.netBalance ?? financeSummary.netTreasuryBalance ?? 0)
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] bg-[#0d1c2d] px-2 py-1.5 rounded-lg border border-[#273647]/40 light:bg-slate-50 light:border-slate-200">
            <span className="text-[#4edea3] font-medium flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3" /> In{' '}
              {financeSummary
                ? formatINR(financeSummary.inflow?.totalInflow ?? financeSummary.totalInflows ?? 0)
                : '—'}
            </span>
            <span className="text-[#8e8fa3]">/</span>
            <span className="text-[#ffb4ab] font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Out{' '}
              {financeSummary
                ? formatINR(financeSummary.outflow?.totalOutflow ?? financeSummary.totalOutflows ?? 0)
                : '—'}
            </span>
          </div>
        </div>

        {/* Card 3: Flagship Event Sales */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                {flagshipEvent ? 'Flagship Event Tickets' : 'Event Sales'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#d4e4fa] tabular-nums light:text-slate-900">
                  {flagshipEvent ? flagshipEvent.registeredCount : 0}
                  <span className="text-sm font-normal text-[#8e8fa3]">
                    /{flagshipEvent?.totalCapacity || '—'}
                  </span>
                </span>
                {flagshipEvent?.totalCapacity && flagshipEvent.totalCapacity > 0 ? (
                  <span className="text-[10px] font-semibold text-[#7bd0ff] bg-[#00a6e0]/20 px-1.5 py-0.5 rounded-full">
                    {Math.round((flagshipEvent.registeredCount / flagshipEvent.totalCapacity) * 100)}% cap
                  </span>
                ) : null}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-1 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[#8e8fa3] light:text-slate-500">Gross Ticket Revenue</span>
              <span className="font-mono text-[#d4e4fa] font-semibold light:text-slate-900">
                {formatINR((flagshipEvent?.registeredCount ?? 0) * (flagshipEvent?.memberPrice ?? 0))}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1c2b3c] overflow-hidden light:bg-slate-200">
              <div
                className="h-full bg-[#7bd0ff] rounded-full"
                style={{
                  width: flagshipEvent?.totalCapacity && flagshipEvent.totalCapacity > 0
                    ? `${Math.min(100, Math.round((flagshipEvent.registeredCount / flagshipEvent.totalCapacity) * 100))}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Fundraiser Status */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Active Fundraiser
              </span>
              <h3 className="text-base font-headline font-semibold text-[#d4e4fa] truncate mt-1 light:text-slate-900">
                {activeFundraiser?.title || 'No Active Drive'}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#b9c3ff] light:bg-slate-100">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-1 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-mono text-[#d4e4fa] font-semibold light:text-slate-900">
                {activeFundraiser
                  ? `${formatINR(activeFundraiser.collectedAmount ?? 0)} / ${formatINR(activeFundraiser.goalAmount)}`
                  : 'Goal pending'}
              </span>
              <span className="text-[#4edea3] font-semibold">
                {activeFundraiser ? `${activeFundraiser.percentRaised ?? 0}% Raised` : 'Standby'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1c2b3c] overflow-hidden light:bg-slate-200">
              <div
                className="h-full bg-[#b9c3ff] rounded-full"
                style={{
                  width: activeFundraiser
                    ? `${Math.min(100, activeFundraiser.percentRaised ?? 0)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Body Grid matching Stitch 65% / 35% Proportion */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols ~ 65%) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Semester Cashflow & Financial Pulse */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle>Semester Cashflow & Financial Pulse</CardTitle>
                <p className="text-[11px] text-[#8e8fa3] light:text-slate-500 mt-0.5">
                  Aggregated weekly revenue (dues, ticket sales, merch) versus operational payouts
                </p>
              </div>
              <div className="flex items-center gap-1 bg-[#0d1c2d] p-1 rounded-lg border border-[#273647]/50 text-[10px] font-medium light:bg-slate-100 light:border-slate-200">
                <span className="px-2 py-0.5 rounded bg-[#1c2b3c] text-[#d4e4fa] font-semibold light:bg-white light:text-slate-900">
                  Monthly
                </span>
                <span className="px-2 py-0.5 text-[#8e8fa3]">Weekly</span>
                <span className="px-2 py-0.5 text-[#8e8fa3]">Term</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Legend & Peak Info */}
              <div className="flex items-center justify-between text-[11px] pb-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[#4edea3]">
                    <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                    Inflow (Dues & Gala)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#7bd0ff]">
                    <span className="w-2 h-2 rounded-full bg-[#7bd0ff]" />
                    Outflow (Logistics & Merch)
                  </span>
                </div>
                <span className="text-[10px] text-[#8e8fa3] font-mono">
                  Net Balance: {financeSummary ? formatINR(financeSummary.netBalance ?? financeSummary.netTreasuryBalance ?? 0) : '—'}
                </span>
              </div>

              {/* Crisp SVG Cashflow Chart matching Stitch screenshot */}
              <div className="h-44 w-full relative flex items-center justify-center bg-[#0d1c2d]/40 rounded-lg border border-[#273647]/40 p-2 light:bg-slate-50">
                <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#273647" strokeDasharray="3 3" strokeOpacity="0.4" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#273647" strokeDasharray="3 3" strokeOpacity="0.4" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#273647" strokeDasharray="3 3" strokeOpacity="0.4" />

                  {/* Gradient fills */}
                  <defs>
                    <linearGradient id="greenPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4edea3" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="bluePulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7bd0ff" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#7bd0ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Green Inflow Curve */}
                  <path
                    d="M 0,130 C 80,120 120,60 200,50 C 280,40 340,90 420,80 C 460,75 480,45 500,40 L 500,160 L 0,160 Z"
                    fill="url(#greenPulse)"
                  />
                  <path
                    d="M 0,130 C 80,120 120,60 200,50 C 280,40 340,90 420,80 C 460,75 480,45 500,40"
                    fill="none"
                    stroke="#4edea3"
                    strokeWidth="2.5"
                  />

                  {/* Blue Outflow Curve */}
                  <path
                    d="M 0,140 C 90,130 150,95 240,90 C 310,85 360,120 440,110 C 470,105 490,95 500,90 L 500,160 L 0,160 Z"
                    fill="url(#bluePulse)"
                  />
                  <path
                    d="M 0,140 C 90,130 150,95 240,90 C 310,85 360,120 440,110 C 470,105 490,95 500,90"
                    fill="none"
                    stroke="#7bd0ff"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Month Markers */}
              <div className="flex justify-between text-[10px] text-[#8e8fa3] px-1 font-medium">
                <span>Aug (Orientation)</span>
                <span>Sep (Club Fair)</span>
                <span>Oct (Homecoming)</span>
                <span>Nov (Midterm Gala Push)</span>
                <span>Dec (Finals Gala)</span>
              </div>

              {/* Summary KPIs bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#273647]/50 text-center">
                <div className="p-2 rounded-lg bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
                  <span className="text-[10px] text-[#8e8fa3]">Total Inflow</span>
                  <div className="text-xs font-bold font-mono text-[#4edea3] mt-0.5">
                    {financeSummary ? formatINR(financeSummary.inflow?.totalInflow ?? financeSummary.totalInflows ?? 0) : '—'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
                  <span className="text-[10px] text-[#8e8fa3]">Total Outflow</span>
                  <div className="text-xs font-bold font-mono text-[#ffb4ab] mt-0.5">
                    {financeSummary ? formatINR(financeSummary.outflow?.totalOutflow ?? financeSummary.totalOutflows ?? 0) : '—'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
                  <span className="text-[10px] text-[#8e8fa3]">Net Position</span>
                  <div className="text-xs font-bold font-mono text-[#7bd0ff] mt-0.5">
                    {financeSummary ? formatINR(financeSummary.netBalance ?? financeSummary.netTreasuryBalance ?? 0) : '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Active Operational Tasks & Fundraiser Sprint */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle>Active Operational Tasks & Volunteer Shifts</CardTitle>
                <p className="text-[11px] text-[#8e8fa3] light:text-slate-500 mt-0.5">
                  {totalTasks !== null ? `${totalTasks} Active Opportunities` : 'Volunteer Ops Pipeline'}
                </p>
              </div>
              <Link to="/volunteers" className="text-xs font-semibold text-[#0047FF] hover:underline flex items-center">
                View All Tasks {totalTasks !== null ? `(${totalTasks})` : ''} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {operationalTasks.length > 0 ? (
                operationalTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 flex items-center justify-between gap-3 light:bg-slate-50 light:border-slate-200">
                    <div className="flex items-start gap-2.5">
                      {task.status === 'PUBLISHED' ? (
                        <Clock className="w-4 h-4 text-[#7bd0ff] shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-[#8e8fa3] mt-0.5">
                          {task.location} • {task.registeredCount}/{task.capacity} Registered
                        </p>
                      </div>
                    </div>
                    <Link to="/volunteers">
                      <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2 py-0">
                        Details
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#8e8fa3]">
                  No active operational volunteer tasks found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols ~ 35%) matching Stitch */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Annual Flagship Gala */}
          <div className="rounded-xl bg-[#122131] border border-[#273647] p-5 shadow-sm relative overflow-hidden light:bg-white light:border-[#E2E8F0]">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#7bd0ff] font-bold">
              <span>Annual Flagship</span>
              <span className="bg-[#1c2b3c] px-2 py-0.5 rounded text-[#d4e4fa] font-mono border border-[#273647]">
                {flagshipEvent ? 'Featured' : 'Standby'}
              </span>
            </div>

            {flagshipEvent ? (
              <>
                <h3 className="text-lg font-headline font-bold text-[#d4e4fa] mt-1.5 light:text-slate-900">
                  {flagshipEvent.title}
                </h3>
                <p className="text-[11px] text-[#8e8fa3] mt-0.5">
                  {flagshipEvent.venue} • {formatDateTime(flagshipEvent.startsAt)}
                </p>

                <div className="mt-4 space-y-2 pt-3 border-t border-[#273647]/50 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#1c2b3c]/60 border border-[#273647]/50 light:bg-slate-100">
                    <span className="text-[#8e8fa3] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#38BDF8]" /> Member Rate
                    </span>
                    <span className="font-mono font-bold text-[#d4e4fa] light:text-slate-900">
                      {formatINR(flagshipEvent.memberPrice)}{' '}
                      <span className="text-[10px] text-[#4edea3] font-normal">
                        {flagshipEvent.totalCapacity
                          ? `(${Math.max(0, flagshipEvent.totalCapacity - flagshipEvent.registeredCount)} Left)`
                          : '(Open Entry)'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#1c2b3c]/60 border border-[#273647]/50 light:bg-slate-100">
                    <span className="text-[#8e8fa3] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#fbbf24]" /> Standard Rate
                    </span>
                    <span className="font-mono font-bold text-[#d4e4fa] light:text-slate-900">
                      {formatINR(flagshipEvent.standardPrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link to={`/events/${flagshipEvent.id}/registrations`} className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647]">
                      Manage Guestlist
                    </Button>
                  </Link>
                  <Link to="/checkin">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0 flex items-center justify-center bg-[#1c2b3c]">
                      <QrCode className="w-4 h-4 text-[#7bd0ff]" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-[#8e8fa3]">
                <p>No upcoming published events.</p>
                <Link to="/events" className="mt-2 inline-block">
                  <Button size="sm" variant="secondary" className="text-xs">
                    Browse Events
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Card: Merch Demand Pulse */}
          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8e8fa3] font-bold">
              <span>Merch Demand Pulse</span>
              <span className="text-[#7bd0ff] font-mono">{featuredMerch ? featuredMerch.category : 'Store'}</span>
            </div>

            {featuredMerch ? (
              <>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#0d1c2d] border border-[#273647] flex items-center justify-center text-[#d4e4fa] shrink-0 light:bg-slate-100">
                    <ShoppingBag className="w-6 h-6 text-[#7bd0ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#d4e4fa] truncate light:text-slate-900">
                        {featuredMerch.name}
                      </p>
                      <span className="text-xs font-mono font-bold text-[#4edea3]">
                        {formatINR(featuredMerch.memberPrice || featuredMerch.standardPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8e8fa3] mt-1">
                      <span className="text-[#7bd0ff] font-medium">
                        {featuredMerch.variants && featuredMerch.variants.length > 0
                          ? `${featuredMerch.variants.reduce((sum, v) => sum + v.stock, 0)} units in stock`
                          : 'In stock'}
                      </span>
                      <span className="font-mono">{featuredMerch.variants?.length ?? 0} variants</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#273647]/50 flex items-center justify-between text-[10px] text-[#8e8fa3]">
                  <span>Catalog Status: Active</span>
                  <Link to="/store" className="text-[#0047FF] hover:underline font-semibold">
                    View in Store →
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-xs text-[#8e8fa3]">
                No merchandise items found.
              </div>
            )}
          </div>

          {/* Card: Live Treasury Feed */}
          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8e8fa3] font-bold pb-2">
              <span className="flex items-center gap-1.5 text-[#4edea3]">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                Live Treasury Feed
              </span>
              <Link to="/treasury" className="text-[10px] text-[#7bd0ff] hover:underline">
                View All
              </Link>
            </div>

            <div className="divide-y divide-[#273647]/40 text-xs">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#d4e4fa] light:text-slate-900">{tx.description}</p>
                      <p className="text-[10px] text-[#8e8fa3]">{tx.category} • {formatDateTime(tx.date)}</p>
                    </div>
                    <span
                      className={`font-mono font-semibold text-xs ${
                        tx.type === 'INFLOW' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                      }`}
                    >
                      {tx.type === 'INFLOW' ? '+' : '-'}{formatINR(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#8e8fa3]">
                  No recent ledger transactions found.
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[#273647]/50 text-center">
              <Link to="/treasury" className="text-xs text-[#0047FF] hover:underline font-semibold">
                Open Full General Ledger →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
