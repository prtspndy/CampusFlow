import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { membershipsService } from '../../services/memberships.service';
import { financeService } from '../../services/finance.service';
import { Membership, MembershipPlan, MembershipStatus } from '../../types/membership';
import { FinanceSummary } from '../../types/finance';
import { hasRole } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatDate, formatINR } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import { BrandMark } from '../../components/brand/BrandMark';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  CreditCard,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Plus,
  Users,
  Search,
  Download,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Ticket,
  ShoppingBag,
  Gift,
} from 'lucide-react';

const PLANS: { id: MembershipPlan; title: string; price: string; period: string; perks: string[] }[] = [
  {
    id: 'semester',
    title: 'Semester Pass',
    price: '₹15',
    period: 'Per Semester',
    perks: ['Discounted event tickets', 'Free entry to club mixer', 'Priority merchandise drop'],
  },
  {
    id: 'annual',
    title: 'Annual Pass',
    price: '₹25',
    period: 'Per Academic Year',
    perks: ['All Semester benefits', 'Official club badge & hoodie voucher', 'Voting rights in student elections', 'Free workshop access'],
  },
  {
    id: 'lifetime',
    title: 'Alumni & Lifetime Pass',
    price: '₹75',
    period: 'Full Degree Tenure',
    perks: ['All Annual benefits', 'Lifetime digital pass', 'Executive committee eligibility', 'Special gala invitations'],
  },
];

export function MembershipsPage() {
  const { user } = useAuth();
  const canManage = hasRole(user, ['ADMIN', 'TREASURER']);

  // Member states
  const [myMemberships, setMyMemberships] = useState<Membership[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>('annual');
  const [applyNotes, setApplyNotes] = useState('');
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // Admin/Staff directory states
  const [allMemberships, setAllMemberships] = useState<Membership[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Previewed Member for the Right Digital Pass panel
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);

  // Admin status transition modal
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'EXPIRED'>('ACTIVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [myRes, allRes, finRes] = await Promise.allSettled([
        membershipsService.getMyMemberships(),
        membershipsService.listMemberships({
          page,
          limit: 10,
          search: searchQuery.trim() || undefined,
          planName: tierFilter === 'ALL' ? undefined : tierFilter,
          status: statusFilter === 'ALL' ? undefined : (statusFilter as MembershipStatus),
        }),
        canManage ? financeService.getSummary() : Promise.resolve(null),
      ]);

      if (myRes.status === 'fulfilled') {
        setMyMemberships(myRes.value || []);
      }
      if (allRes.status === 'fulfilled') {
        setAllMemberships(allRes.value.memberships || []);
        setTotalCount(allRes.value.total || 0);
        if (allRes.value.memberships?.length > 0 && !selectedMember) {
          setSelectedMember(allRes.value.memberships[0]);
        }
      }
      if (finRes.status === 'fulfilled' && finRes.value) {
        setFinanceSummary(finRes.value);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setActionError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, tierFilter, statusFilter, canManage, selectedMember]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingApply(true);
    setActionError(null);
    try {
      await membershipsService.apply({
        planName: selectedPlan,
        notes: applyNotes.trim() || undefined,
      });
      setIsApplying(false);
      setApplyNotes('');
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setActionError(parsed.message);
    } finally {
      setIsSubmittingApply(false);
    }
  };

  const handleRenew = async (membershipId: string) => {
    setActionError(null);
    try {
      await membershipsService.renew(membershipId);
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setActionError(parsed.message);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMembership) return;
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      await membershipsService.updateStatus(editingMembership.id, {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      });
      setEditingMembership(null);
      setAdminNotes('');
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setActionError(parsed.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const visibleMemberships = canManage ? allMemberships : myMemberships;
  const visibleTotal = canManage ? totalCount : myMemberships.length;

  const exportRoster = () => {
    const header = ['Name', 'Email', 'Plan', 'Status', 'Payment', 'Fee', 'Valid until'];
    const rows = visibleMemberships.map((membership) => [
      membership.user?.name || '',
      membership.user?.email || '',
      membership.planName,
      membership.status,
      membership.paymentStatus || '',
      String(membership.feeAmount ?? ''),
      membership.validUntil || '',
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campusflow-memberships.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Page Header matching Stitch stitch_members_dues.png */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] flex items-center gap-2">
            <span>Fall 2026 Term Operations</span>
            <span className="text-[#273647]">•</span>
            <span className="text-[#4edea3]">Campus Table Live Sync</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#d4e4fa] tracking-tight mt-0.5 light:text-slate-900">
            Membership Directory & Dues Tracker
          </h1>
          <p className="text-xs text-[#8e8fa3] mt-0.5 max-w-2xl light:text-slate-500">
            Process walk-up student booth sign-ups, reconcile cash or Stripe dues, activate member perks, and issue NFC/QR Apple and Google Wallet passes.
          </p>
        </div>

        {/* Action Toolbelt matching Stitch */}
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <Button size="sm" variant="secondary" className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647] text-[#d4e4fa]" onClick={exportRoster}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            className="h-8 text-xs bg-[#0047FF] hover:bg-[#0038CC] shadow-none font-semibold text-white"
            onClick={() => setIsApplying(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            + Manual Walkup Sign-up
          </Button>
        </div>
      </section>

      {actionError && (
        <div className="p-3 rounded-lg bg-[#93000a]/20 border border-[#93000a]/50 text-[#ffb4ab] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 4 Metric Cards matching Stitch */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">Total Enrolled</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-headline text-[#d4e4fa] tabular-nums light:text-slate-900">
                  {visibleTotal}
                </span>
                <span className="text-[10px] font-semibold text-[#4edea3]">
                  {visibleMemberships.filter((m) => m.status === 'ACTIVE').length} Active
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-1 flex items-center justify-between text-[10px] text-[#8e8fa3]">
            <span>Active Rate</span>
            <span className="font-mono text-[#d4e4fa] font-semibold light:text-slate-900">
              {visibleTotal > 0 ? Math.min(100, Math.round((visibleMemberships.filter((m) => m.status === 'ACTIVE').length / visibleTotal) * 100)) : 100}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1c2b3c] overflow-hidden mt-1 light:bg-slate-200">
            <div
              className="h-full bg-[#0047FF] rounded-full"
              style={{
                width: `${visibleTotal > 0 ? Math.min(100, Math.round((visibleMemberships.filter((m) => m.status === 'ACTIVE').length / visibleTotal) * 100)) : 100}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">Dues / Inflow</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#4edea3] tabular-nums">
                  {financeSummary ? formatINR(financeSummary.inflow?.totalInflow ?? financeSummary.totalInflows ?? 0) : '—'}
                </span>
                <span className="text-[10px] text-[#8e8fa3]">Treasury</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-1 flex items-center justify-between text-[10px] text-[#8e8fa3]">
            <span>Verified Inflows</span>
            <span className="text-[#4edea3] font-semibold">Ledger Synced</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">Pending Review</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#ffb4ab] tabular-nums">
                  {visibleMemberships.filter((m) => m.status === 'PENDING').length}
                </span>
                <span className="text-[10px] font-semibold text-[#ffb4ab] bg-[#93000a]/20 px-1.5 py-0.5 rounded">
                  Students
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#ffb4ab] light:bg-slate-100">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-1 flex items-center justify-between text-[10px] text-[#8e8fa3]">
            <span>Applications</span>
            <span className="text-[#ffb4ab]">Awaiting Staff Action</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">Digital Passes</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#d4e4fa] tabular-nums light:text-slate-900">
                  {visibleMemberships.filter((m) => m.status === 'ACTIVE').length}
                </span>
                <span className="text-[10px] font-semibold text-[#7bd0ff]">Active</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#7bd0ff] light:bg-slate-100">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-1 flex items-center justify-between text-[10px] text-[#8e8fa3]">
            <span>Credentials</span>
            <span className="text-[#7bd0ff]">Live Membership Passes</span>
          </div>
        </div>
      </section>

      {/* Filter Bar matching Stitch */}
      <section className="rounded-xl bg-[#122131] border border-[#273647]/60 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 light:bg-white light:border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8fa3]" />
          <input
            type="text"
            placeholder="Search by student ID (e.g. SKY-), name, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-8 pl-9 pr-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] placeholder:text-[#8e8fa3] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-200 light:text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] text-xs focus:outline-none light:bg-slate-50 light:border-slate-200 light:text-slate-900"
          >
            <option value="ALL">Status: All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] text-xs focus:outline-none light:bg-slate-50 light:border-slate-200 light:text-slate-900"
          >
            <option value="ALL">Tier: All Tiers</option>
            <option value="annual">Annual</option>
            <option value="semester">Semester</option>
            <option value="lifetime">Lifetime</option>
          </select>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-[#8e8fa3]"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setTierFilter('ALL');
            }}
          >
            Reset
          </Button>
        </div>
      </section>

      {/* Split Layout: Active Roster Table (Left 65%) vs Digital Pass Preview (Right 35%) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 overflow-hidden shadow-sm light:bg-white light:border-slate-200">
            <div className="px-4 py-3 border-b border-[#273647]/50 flex items-center justify-between text-xs">
              <span className="font-bold text-[#d4e4fa] light:text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#7bd0ff]" />
                Active Roster ({visibleMemberships.length} records)
              </span>
              <span className="text-[10px] text-[#8e8fa3]">Click row to preview Digital Pass</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0d1c2d] border-b border-[#273647]/60 text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:bg-slate-50 light:border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-3 py-2.5">Student ID</th>
                    <th className="px-3 py-2.5">Tier</th>
                    <th className="px-3 py-2.5">Dues Status</th>
                    <th className="px-3 py-2.5">Entitled Perks</th>
                    <th className="px-3 py-2.5">Renewal Due</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273647]/40 light:divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <Skeleton className="h-20 w-full" />
                      </td>
                    </tr>
                  ) : visibleMemberships.length > 0 ? (
                    visibleMemberships.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        className={`h-12 cursor-pointer transition-colors ${
                          selectedMember?.id === m.id
                            ? 'bg-[#0047FF]/15 border-l-2 border-l-[#0047FF]'
                            : 'hover:bg-[#1c2b3c]/60 light:hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#1c2b3c] border border-[#273647] flex items-center justify-center font-bold text-xs text-[#7bd0ff] shrink-0">
                              {m.user?.name?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#d4e4fa] truncate light:text-slate-900">{m.user?.name || 'Student Member'}</p>
                              <p className="text-[10px] text-[#8e8fa3] truncate">{m.user?.email || 'student@campus.edu'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[#8e8fa3]">
                          SKY-{m.id.slice(0, 4).toUpperCase()}
                        </td>
                        <td className="px-3 py-2">
                          <span className="capitalize text-[11px] font-medium text-[#d4e4fa] light:text-slate-800">
                            {m.planName}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {m.paymentStatus === 'PAID' || m.status === 'ACTIVE' || m.status === 'SUSPENDED' || m.status === 'EXPIRED' ? (
                            <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded-full border border-[#006e4b]/40">
                              {m.status === 'EXPIRED'
                                ? 'Paid · Expired'
                                : m.status === 'SUSPENDED'
                                  ? 'Paid · Suspended'
                                  : `Paid · ${formatINR(m.feeAmount ?? (m.planName === 'semester' ? 15 : m.planName === 'lifetime' ? 75 : 25))}`}
                            </span>
                          ) : m.status === 'REJECTED' ? (
                            <span className="text-[10px] font-semibold text-[#ffb4ab] bg-[#93000a]/20 px-2 py-0.5 rounded-full border border-[#93000a]/40">
                              Unpaid · Rejected
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-full border border-[#fbbf24]/30">
                              Unpaid · {formatINR(m.feeAmount ?? (m.planName === 'semester' ? 15 : m.planName === 'lifetime' ? 75 : 25))}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5 text-[#8e8fa3]">
                            <Ticket className="w-3.5 h-3.5 text-[#7bd0ff]" />
                            <ShoppingBag className="w-3.5 h-3.5 text-[#4edea3]" />
                            <Gift className="w-3.5 h-3.5 text-[#b9c3ff]" />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-[#8e8fa3]">
                          {m.validUntil ? formatDate(m.validUntil) : 'Perpetual'}
                        </td>
                        <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          {canManage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] px-2 text-[#7bd0ff]"
                              onClick={() => {
                                setEditingMembership(m);
                                setNewStatus(m.status === 'PENDING' ? 'ACTIVE' : (m.status as any));
                              }}
                            >
                              Edit Status
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-[#8e8fa3]">
                        No member records found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-2.5 border-t border-[#273647]/50 flex items-center justify-between text-xs text-[#8e8fa3] bg-[#0d1c2d]/40 light:bg-slate-50">
              <span>Showing {visibleMemberships.length === 0 ? 0 : 1} to {visibleMemberships.length} of {visibleTotal} members</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 text-xs">
                  Previous
                </Button>
                <span className="px-2 py-0.5 rounded bg-[#0047FF] text-white font-semibold text-xs">
                  {page}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setPage(page + 1)} className="h-7 text-xs">
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Digital Pass Preview matching Stitch */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-[#122131] border border-[#273647]/70 p-5 shadow-sm space-y-4 light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d4e4fa] flex items-center gap-1.5 light:text-slate-900">
                <QrCode className="w-4 h-4 text-[#7bd0ff]" />
                Digital Pass Preview
              </span>
              <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded-full border border-[#006e4b]/40">
                Active Verified
              </span>
            </div>

            {/* Digital Pass Card */}
            {selectedMember ? (
              <>
                <div className="p-4 rounded-xl bg-[#122131] border border-[#273647] space-y-3 relative light:bg-white light:border-[#E2E8F0]">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#8e8fa3] font-semibold">
                        CampusFlow Student Assoc.
                      </span>
                      <h4 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900 capitalize">
                        {selectedMember.planName} Member
                      </h4>
                    </div>
                    <BrandMark labelled className="w-7 h-7 shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-full bg-[#122131] border border-[#273647] flex items-center justify-center font-bold text-xs text-[#7bd0ff]">
                      {selectedMember.user?.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">
                        {selectedMember.user?.name || 'Member'}
                      </p>
                      <p className="text-[10px] text-[#8e8fa3]">
                        {selectedMember.user?.email || 'Student'} • SKY-{selectedMember.memberCode || selectedMember.id.slice(0, 4).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* QR Code and Token */}
                  <div className="p-2 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 flex items-center justify-between gap-3 light:bg-white">
                    <div className="space-y-0.5 text-[9px] text-[#8e8fa3]">
                      <div className="font-semibold text-[#7bd0ff]">NFC TOKEN / QR SCAN</div>
                      <div className="font-mono text-[#d4e4fa]">
                        {selectedMember.memberCode || `AUTH-${selectedMember.id.slice(0, 8).toUpperCase()}`}
                      </div>
                      <div>Tap at Campus Door / Booth</div>
                    </div>
                    <div className="w-12 h-12 bg-white p-1 rounded flex items-center justify-center shrink-0">
                      <QrCode className="w-full h-full text-slate-900" />
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-[#8e8fa3] pt-1">
                    <span>STATUS: {selectedMember.status}</span>
                    <span>EXPIRES: {selectedMember.validUntil ? formatDate(selectedMember.validUntil) : 'Indefinite'}</span>
                  </div>
                </div>

                {/* Entitled Perks Package */}
                <div className="space-y-2 pt-1 text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-[#8e8fa3] font-semibold">
                    Entitled Perks Package ({selectedMember.perks?.length || 0} Listed)
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    {selectedMember.perks && selectedMember.perks.length > 0 ? (
                      selectedMember.perks.map((perk, i) => (
                        <div key={i} className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
                          <span className="text-[#d4e4fa] flex items-center gap-1.5 light:text-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" /> {perk}
                          </span>
                          <span className="text-[10px] text-[#4edea3] font-medium">Included</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 text-center text-[10px] text-[#8e8fa3] light:bg-slate-50">
                        Standard CampusFlow Member Privileges
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-[#8e8fa3]">
                Select a member from the directory to inspect pass details.
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Membership Plans for Self-Signup / Upgrades */}
      <section className="space-y-4 pt-4 border-t border-[#273647]/50">
        <div>
          <h3 className="text-base font-headline font-bold text-[#d4e4fa] light:text-slate-900">
            Available Membership Plans & Passes
          </h3>
          <p className="text-xs text-[#8e8fa3] light:text-slate-500">
            Select a tier to activate your campus privileges and digital pass.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl bg-[#122131] border border-[#273647]/60 p-5 shadow-sm flex flex-col justify-between light:bg-white light:border-slate-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">{plan.title}</h4>
                  <span className="text-[10px] font-semibold text-[#7bd0ff] bg-[#00a6e0]/15 px-2 py-0.5 rounded-full">
                    {plan.period}
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#d4e4fa] light:text-slate-900">
                  {plan.price}
                </div>
                <ul className="space-y-1.5 text-xs text-[#8e8fa3] pt-2 border-t border-[#273647]/40">
                  {plan.perks.map((p, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-[#273647]/40">
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full h-8 text-xs bg-[#0047FF] hover:bg-[#0038CC] shadow-none"
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setIsApplying(true);
                  }}
                >
                  Choose {plan.title}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Manual Walkup Sign-up / Application Modal */}
      {isApplying && (
        <Modal isOpen={isApplying} onClose={() => setIsApplying(false)} title="Register Student Membership">
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Select Pass Plan
              </label>
              <Select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as MembershipPlan)}
                options={[
                  { value: 'semester', label: 'Semester Pass (₹15)' },
                  { value: 'annual', label: 'Annual Pass (₹25)' },
                  { value: 'lifetime', label: 'Alumni & Lifetime Pass (₹75)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Application Notes / Walkup Receipt Ref (Optional)
              </label>
              <textarea
                rows={3}
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                placeholder="e.g. Paid cash at orientation booth, student ID #..."
                className="w-full text-xs p-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] placeholder:text-[#8e8fa3] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsApplying(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmittingApply}>
                Confirm Membership
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Status Transition Modal */}
      {editingMembership && (
        <Modal isOpen={!!editingMembership} onClose={() => setEditingMembership(null)} title="Update Membership Record">
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <span className="text-xs text-[#8e8fa3]">Student:</span>
              <p className="text-sm font-semibold text-[#d4e4fa] light:text-slate-900">
                {editingMembership.user?.name} ({editingMembership.user?.email})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Membership Status
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'EXPIRED')}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE (Paid / Verified)' },
                  { value: 'SUSPENDED', label: 'SUSPENDED' },
                  { value: 'EXPIRED', label: 'EXPIRED' },
                  { value: 'REJECTED', label: 'REJECTED' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Auditor Notes
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reason for status modification..."
                className="w-full text-xs p-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] placeholder:text-[#8e8fa3] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditingMembership(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatingStatus}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
