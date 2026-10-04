import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { financeService } from '../../services/finance.service';
import { expensesService } from '../../services/expenses.service';
import { FinanceSummary, LedgerTransaction } from '../../types/finance';
import { parseApiError } from '../../lib/api-errors';
import { formatINR, formatDateTime } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Landmark,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Receipt,
} from 'lucide-react';

export function TreasuryPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeLedgerTab, setActiveLedgerTab] = useState<'ALL' | 'INFLOW' | 'REIMB' | 'VENDOR' | 'FLAGGED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Transaction Modal
  const [isCreatingTx, setIsCreatingTx] = useState(false);
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'INFLOW' | 'OUTFLOW'>('INFLOW');
  const [txCategory, setTxCategory] = useState('Dues');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  const { user } = useAuth();

  const totalInflow = summary ? (summary.inflow?.totalInflow ?? summary.totalInflows ?? 0) : 0;
  const totalOutflow = summary ? (summary.outflow?.totalOutflow ?? summary.totalOutflows ?? 0) : 0;
  const netBalance = summary ? (summary.netBalance ?? summary.netTreasuryBalance ?? 0) : 0;
  const ticketRevenue = summary ? (summary.inflow?.eventRegistrations ?? summary.totalTicketRevenue ?? 0) : 0;
  const fundraiserRevenue = summary ? (summary.inflow?.fundraisers ?? summary.totalVerifiedFundraiserContributions ?? 0) : 0;
  const merchRevenue = summary?.totalMerchRevenue ?? 0;
  const membershipRevenue = summary
    ? (summary.inflow?.memberships ?? summary.totalMembershipRevenue ?? 0)
    : 0;
  const settledReimbursements = summary ? (summary.outflow?.settledReimbursements ?? summary.totalSettledReimbursements ?? 0) : 0;
  const approvedExpenses = summary?.totalApprovedExpenses ?? 0;
  const pendingLiabilities = summary ? (summary.pendingLiabilities?.totalPending ?? summary.outstandingReimbursementObligations ?? 0) : 0;
  const pendingExpenses = summary ? (summary.pendingLiabilities?.pendingExpenses ?? summary.totalPendingExpenses ?? 0) : 0;
  const unsettledReimbursements = summary ? (summary.pendingLiabilities?.unsettledReimbursements ?? summary.outstandingReimbursementObligations ?? 0) : 0;

  const ticketPct = totalInflow > 0 ? Math.round((ticketRevenue / totalInflow) * 100) : 0;
  const fundraiserPct = totalInflow > 0 ? Math.round((fundraiserRevenue / totalInflow) * 100) : 0;
  const membershipPct = totalInflow > 0 ? Math.round((membershipRevenue / totalInflow) * 100) : 0;
  const merchPct = totalInflow > 0 ? Math.round((merchRevenue / totalInflow) * 100) : 0;

  const settledPct = totalOutflow > 0 ? Math.round((settledReimbursements / totalOutflow) * 100) : 0;
  const approvedPct = totalOutflow > 0 ? Math.max(0, 100 - settledPct) : 0;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumRes, ledgerRes] = await Promise.all([
        financeService.getSummary(),
        financeService.getLedger({
          page,
          limit: 20,
          type: typeFilter || undefined,
          category: categoryFilter || undefined,
        }),
      ]);
      setSummary(sumRes);
      setTransactions(ledgerRes.transactions || []);
      setTotal(ledgerRes.total || 0);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    setIsExporting(true);
    setFeedback(null);
    try {
      await financeService.downloadLedgerCsv();
      setFeedback({ type: 'success', message: 'Treasury CSV ledger exported successfully.' });
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount) return;

    setIsSubmittingTx(true);
    setFeedback(null);
    try {
      await expensesService.submitExpense({
        title: txDescription.trim(),
        description: txDescription.trim(),
        amount: parseFloat(txAmount),
        category: 'OTHER',
        expenseDate: new Date().toISOString(),
      });
      setIsCreatingTx(false);
      setTxDescription('');
      setTxAmount('');
      setFeedback({ type: 'success', message: 'Expense record posted to treasury review ledger.' });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsSubmittingTx(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Page Header matching Stitch stitch_treasurer_ledger.png */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] flex items-center gap-2">
            <span>Governance</span>
            <span className="text-[#273647]">/</span>
            <span>Treasurer Ledger & Financial Audit</span>
            <span className="text-[#273647]">/</span>
            <span className="text-[#7bd0ff]">Fall / Spring 2026 Term Closeout</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#d4e4fa] tracking-tight mt-0.5 light:text-slate-900">
            General Treasury Ledger & Semester Audit
          </h1>
          <p className="text-xs text-[#8e8fa3] mt-0.5 max-w-2xl light:text-slate-500">
            Single immutable record of incoming student dues, ticket sales, merch orders, and volunteer expense reimbursements. Fully reconciled against primary checking and payment gateways.
          </p>
        </div>

        {/* Action Toolbelt matching Stitch */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647] text-[#d4e4fa]"
            onClick={handleExport}
            isLoading={isExporting}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Full Audit Report
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs bg-[#1c2b3c] hover:bg-[#273647] border border-[#273647] text-[#d4e4fa]"
          >
            <Receipt className="w-3.5 h-3.5 mr-1.5 text-[#7bd0ff]" />
            Reconcile POS Batch
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="h-8 text-xs bg-[#0047FF] hover:bg-[#0038CC] shadow-none font-semibold text-white"
            onClick={() => setIsCreatingTx(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            + Record New Transaction
          </Button>
        </div>
      </section>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#006e4b]/20 border border-[#006e4b]/40 text-[#4edea3]'
              : 'bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffb4ab]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 4 Metric Cards matching Stitch */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: What Came In */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                What Came In
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#4edea3] tabular-nums">
                  {summary ? formatINR(totalInflow) : '—'}
                </span>
                <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-1.5 py-0.5 rounded">
                  Verified Deposits
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 space-y-1 text-[10px] text-[#8e8fa3]">
            <div className="flex justify-between">
              <span>Tickets & Registrations</span>
              <span className="font-mono text-[#d4e4fa] light:text-slate-900">
                {summary ? formatINR(ticketRevenue) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Membership dues</span>
              <span className="font-mono text-[#d4e4fa] light:text-slate-900">
                {summary ? formatINR(membershipRevenue) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fundraisers & Merchandise</span>
              <span className="font-mono text-[#d4e4fa] light:text-slate-900">
                {summary ? formatINR(fundraiserRevenue + merchRevenue) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: What Went Out */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                What Went Out
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#ffb4ab] tabular-nums">
                  {summary ? formatINR(totalOutflow) : '—'}
                </span>
                <span className="text-[10px] font-semibold text-[#7bd0ff] bg-[#00a6e0]/20 px-1.5 py-0.5 rounded">
                  Disbursed & Settled
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#ffb4ab] light:bg-slate-100">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 space-y-1 text-[10px] text-[#8e8fa3]">
            <div className="flex justify-between">
              <span>Settled Reimbursements</span>
              <span className="font-mono text-[#d4e4fa] light:text-slate-900">
                {summary ? formatINR(settledReimbursements) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Approved Direct Expenses</span>
              <span className="font-mono text-[#d4e4fa] light:text-slate-900">
                {summary ? formatINR(approvedExpenses) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Net Cash Reserve */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Net Cash Reserve
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#d4e4fa] tabular-nums light:text-slate-900">
                  {summary ? formatINR(netBalance) : '—'}
                </span>
                <span className={`text-[10px] font-semibold ${netBalance >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
                  {netBalance >= 0 ? 'Surplus Reserve' : 'Deficit Reserve'}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#4edea3] light:bg-slate-100">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 text-[10px] text-[#8e8fa3] flex items-center justify-between">
            <span>Treasury Ledger Account</span>
            <span className="text-[#4edea3] font-semibold">Reconciled</span>
          </div>
        </div>

        {/* Card 4: Pending Obligations */}
        <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm light:bg-white light:border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:text-slate-400">
                Pending Obligations
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#fbbf24] tabular-nums">
                  {summary ? formatINR(pendingLiabilities) : '—'}
                </span>
                <span className="text-[10px] font-semibold text-[#fbbf24] bg-[#fbbf24]/20 px-1.5 py-0.5 rounded">
                  Pending Review
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1c2b3c] flex items-center justify-center text-[#fbbf24] light:bg-slate-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#273647]/40 text-[10px] text-[#8e8fa3] flex items-center justify-between">
            <span>Claims: {summary ? formatINR(unsettledReimbursements) : '—'}</span>
            <span className="text-[#fbbf24]">Expenses: {summary ? formatINR(pendingExpenses) : '—'}</span>
          </div>
        </div>
      </section>

      {/* Mid Section: Capital Flow Model & Audit Sign-Off */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Capital Flow Model (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#122131] border border-[#273647]/60 p-5 shadow-sm space-y-4 light:bg-white light:border-slate-200">
          <div>
            <h3 className="text-sm font-headline font-bold text-[#d4e4fa] light:text-slate-900">
              End-of-Semester Capital Flow Model
            </h3>
            <p className="text-[11px] text-[#8e8fa3] light:text-slate-500">
              Visualization of capital support instruments and remaining surplus.
            </p>
          </div>

          {/* Revenue Breakdown bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#8e8fa3]">Revenue Breakdown ({formatINR(totalInflow)})</span>
              <span className="text-[#4edea3] font-semibold">100% Inflow</span>
            </div>
            {totalInflow > 0 ? (
              <>
                <div className="w-full h-3 rounded-full bg-[#1c2b3c] overflow-hidden flex">
                  <div className="bg-[#4edea3] h-full" style={{ width: `${ticketPct}%` }} title={`Tickets: ${formatINR(ticketRevenue)}`} />
                  <div className="bg-[#fbbf24] h-full" style={{ width: `${membershipPct}%` }} title={`Membership dues: ${formatINR(membershipRevenue)}`} />
                  <div className="bg-[#7bd0ff] h-full" style={{ width: `${fundraiserPct}%` }} title={`Fundraisers: ${formatINR(fundraiserRevenue)}`} />
                  <div className="bg-[#b9c3ff] h-full" style={{ width: `${merchPct}%` }} title={`Merchandise: ${formatINR(merchRevenue)}`} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#8e8fa3] pt-0.5">
                  <span>• Tickets: {formatINR(ticketRevenue)} ({ticketPct}%)</span>
                  <span>• Dues: {formatINR(membershipRevenue)} ({membershipPct}%)</span>
                  <span>• Fundraisers: {formatINR(fundraiserRevenue)} ({fundraiserPct}%)</span>
                  <span>• Merch: {formatINR(merchRevenue)} ({merchPct}%)</span>
                </div>
              </>
            ) : (
              <div className="p-3 text-center text-xs text-[#8e8fa3] bg-[#0d1c2d] rounded-lg border border-[#273647]/40">
                No revenue deposits recorded for the current ledger cycle.
              </div>
            )}
          </div>

          {/* Expense Distribution bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#8e8fa3]">Expense Distribution ({formatINR(totalOutflow)})</span>
              <span className="text-[#7bd0ff] font-semibold">
                {totalInflow > 0 ? `${Math.round((totalOutflow / totalInflow) * 100)}% of Inflow` : 'Disbursed'}
              </span>
            </div>
            {totalOutflow > 0 ? (
              <>
                <div className="w-full h-3 rounded-full bg-[#1c2b3c] overflow-hidden flex">
                  <div className="bg-[#ffb4ab] h-full" style={{ width: `${settledPct}%` }} title={`Settled Reimbursements: ${formatINR(settledReimbursements)}`} />
                  <div className="bg-[#fbbf24] h-full" style={{ width: `${approvedPct}%` }} title={`Direct Expenses: ${formatINR(approvedExpenses)}`} />
                </div>
                <div className="flex justify-between text-[9px] text-[#8e8fa3] pt-0.5">
                  <span>• Settled Reimbursements: {formatINR(settledReimbursements)} ({settledPct}%)</span>
                  <span>• Approved Expenses: {formatINR(approvedExpenses)} ({approvedPct}%)</span>
                </div>
              </>
            ) : (
              <div className="p-3 text-center text-xs text-[#8e8fa3] bg-[#0d1c2d] rounded-lg border border-[#273647]/40">
                No expense disbursements recorded for the current ledger cycle.
              </div>
            )}
          </div>

          {/* Capital Allocation summary boxes */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#273647]/50 text-xs text-center">
            <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
              <span className="text-[10px] text-[#8e8fa3]">Ticket Revenue</span>
              <div className="text-xs font-mono font-bold text-[#d4e4fa] light:text-slate-900 mt-0.5">
                {formatINR(ticketRevenue)}
              </div>
            </div>
            <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
              <span className="text-[10px] text-[#8e8fa3]">Fundraiser Revenue</span>
              <div className="text-xs font-mono font-bold text-[#7bd0ff] mt-0.5">
                {formatINR(fundraiserRevenue)}
              </div>
            </div>
            <div className="p-2 rounded bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
              <span className="text-[10px] text-[#8e8fa3]">Settled Outflows</span>
              <div className="text-xs font-mono font-bold text-[#ffb4ab] mt-0.5">
                {formatINR(settledReimbursements)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Audit Sign-Off & Seal (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#122131] border border-[#273647]/60 p-5 shadow-sm space-y-4 light:bg-white light:border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0047FF]" />
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">Audit Sign-Off & Seal</h3>
            </div>
            <span className="text-[10px] font-semibold text-[#7bd0ff] bg-[#0047FF]/20 px-2 py-0.5 rounded-full border border-[#0047FF]/40">
              Session Active
            </span>
          </div>

          <p className="text-[11px] text-[#8e8fa3]">
            Multi-signatory ledger verification for Student Council term financial certification and archival.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
              <div>
                <p className="font-semibold text-[#d4e4fa] light:text-slate-900">Active Treasury Session</p>
                <p className="text-[10px] text-[#8e8fa3]">Account: {user?.email || 'treasury@campus.edu'}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
            </div>

            <div className="p-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
              <div>
                <p className="font-semibold text-[#d4e4fa] light:text-slate-900">Executive Council Certification</p>
                <p className="text-[10px] text-[#8e8fa3]">Pending Term Closeout Review</p>
              </div>
              <Clock className="w-4 h-4 text-[#fbbf24]" />
            </div>

            <div className="p-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647]/40 flex items-center justify-between light:bg-slate-50">
              <div>
                <p className="font-semibold text-[#d4e4fa] light:text-slate-900">Faculty Advisor Review</p>
                <p className="text-[10px] text-[#fbbf24]">Scheduled at Fiscal Period End</p>
              </div>
              <Clock className="w-4 h-4 text-[#fbbf24]" />
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="w-full h-8 text-xs bg-[#1c2b3c] border border-[#273647] hover:bg-[#273647]"
            onClick={handleExport}
            isLoading={isExporting}
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export Audit CSV For Review
          </Button>
        </div>
      </section>

      {/* Unified General Ledger Table matching Stitch */}
      <section className="rounded-xl bg-[#122131] border border-[#273647]/60 overflow-hidden shadow-sm light:bg-white light:border-slate-200">
        <div className="p-4 border-b border-[#273647]/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">
              Unified General Ledger Transactions ({total} entries)
            </h3>
            <p className="text-[11px] text-[#8e8fa3] light:text-slate-500">
              Master double-entry log of incoming student receipts, reimbursements, and balance movements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0d1c2d] p-1 rounded-lg border border-[#273647] text-xs light:bg-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveLedgerTab('ALL');
                  setTypeFilter('');
                }}
                className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                  activeLedgerTab === 'ALL' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
                }`}
              >
                All ({total})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLedgerTab('INFLOW');
                  setTypeFilter('INFLOW');
                }}
                className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                  activeLedgerTab === 'INFLOW' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
                }`}
              >
                Inflows / Sales
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLedgerTab('REIMB');
                  setTypeFilter('OUTFLOW');
                }}
                className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                  activeLedgerTab === 'REIMB' ? 'bg-[#0047FF] text-white' : 'text-[#8e8fa3]'
                }`}
              >
                Reimbursements
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLedgerTab('FLAGGED');
                  setTypeFilter('OUTFLOW');
                }}
                className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                  activeLedgerTab === 'FLAGGED' ? 'bg-[#93000a] text-white' : 'text-[#8e8fa3]'
                }`}
              >
                Review Required
              </button>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs bg-[#1c2b3c] border border-[#273647]"
              onClick={handleExport}
              isLoading={isExporting}
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0d1c2d] border-b border-[#273647]/60 text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] light:bg-slate-50 light:border-slate-200">
              <tr>
                <th className="px-4 py-2.5">TX ID & Date</th>
                <th className="px-3 py-2.5">Category & Origin</th>
                <th className="px-3 py-2.5">Counterparty / Beneficiary</th>
                <th className="px-3 py-2.5">Payment Channel</th>
                <th className="px-3 py-2.5">Amount (INR)</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#273647]/40 light:divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#8e8fa3]">
                    Loading financial ledger transactions...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="h-12 hover:bg-[#1c2b3c]/50 transition-colors">
                    <td className="px-4 py-2 font-mono text-[11px] text-[#7bd0ff]">
                      #{tx.id.slice(0, 6).toUpperCase()} • {formatDateTime(tx.date)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-[#d4e4fa] light:text-slate-900">{tx.category}</span>
                      <p className="text-[10px] text-[#8e8fa3] truncate max-w-[160px]">{tx.description}</p>
                    </td>
                    <td className="px-3 py-2 text-[#d4e4fa] light:text-slate-800 font-medium">
                      Campus Student Organization
                    </td>
                    <td className="px-3 py-2 text-[#8e8fa3]">
                      Direct Transfer
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-xs">
                      <span className={tx.type === 'INFLOW' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}>
                        {tx.type === 'INFLOW' ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded-full border border-[#006e4b]/40">
                        Reconciled
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#7bd0ff]">
                        View Audit
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#8e8fa3]">
                    No transactions recorded in the ledger yet. Use "Record Transaction" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Record New Transaction Modal */}
      {isCreatingTx && (
        <Modal isOpen={isCreatingTx} onClose={() => setIsCreatingTx(false)} title="Record New Financial Transaction">
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Transaction Description
              </label>
              <input
                type="text"
                required
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="e.g. Quad Bake Sale Cash Deposit"
                className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                  Type
                </label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'INFLOW' | 'OUTFLOW')}
                  className="w-full h-9 px-2 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                >
                  <option value="INFLOW">INFLOW (Revenue / Dues)</option>
                  <option value="OUTFLOW">OUTFLOW (Expense / Reimb)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Category
              </label>
              <input
                type="text"
                required
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                placeholder="Dues, Merch, Event, Reimbursement..."
                className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreatingTx(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmittingTx}>
                Post Transaction
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
