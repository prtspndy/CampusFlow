import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { financeService } from '../../services/finance.service';
import { expensesService } from '../../services/expenses.service';
import { reimbursementsService } from '../../services/reimbursements.service';
import { FinanceSummary, Expense, Reimbursement } from '../../types/finance';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatINR, formatDate } from '../../lib/formatters';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  Receipt,
  CreditCard,
} from 'lucide-react';

export function TreasurerDashboard() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [pendingReimbursements, setPendingReimbursements] = useState<Reimbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTreasurerData() {
      try {
        const [sumRes, expRes, reimbRes] = await Promise.allSettled([
          financeService.getSummary(),
          expensesService.listExpenses({ status: 'PENDING', limit: 4 }),
          reimbursementsService.listReimbursements({ status: 'APPROVED', limit: 4 }),
        ]);

        if (isMounted) {
          if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
          if (expRes.status === 'fulfilled') setPendingExpenses(expRes.value.expenses || []);
          if (reimbRes.status === 'fulfilled')
            setPendingReimbursements(reimbRes.value.reimbursements || []);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTreasurerData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await financeService.downloadLedgerCsv();
    } catch {
      // Handled by axios
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border/60 light:border-light-border">
        <div>
          <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text flex items-center gap-2">
            <Landmark className="w-6 h-6 text-brand" />
            Treasury & Financial Operations
          </h1>
          <p className="text-xs text-dark-muted light:text-light-muted mt-0.5">
            Cash flows, expense vouchers, reimbursement settlements, and audit-ready ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            isLoading={isExporting}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Ledger CSV
          </Button>
          <Link to="/treasury">
            <Button size="sm" variant="primary">
              General Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance */}
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark-muted font-medium">Net Operating Balance</span>
            <div className="text-xl font-headline font-bold text-dark-text font-mono tabular-nums light:text-light-text">
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : summary ? (
                formatINR(summary.netBalance ?? summary.netTreasuryBalance ?? 0)
              ) : (
                '—'
              )}
            </div>
          </div>
        </Card>

        {/* Total Inflow */}
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark-muted font-medium">Total Inflows (Rupees)</span>
            <div className="text-xl font-headline font-bold text-emerald-400 font-mono tabular-nums">
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : summary ? (
                formatINR(summary.inflow?.totalInflow ?? summary.totalInflows ?? 0)
              ) : (
                '—'
              )}
            </div>
          </div>
        </Card>

        {/* Total Outflow */}
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-status-error-text flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark-muted font-medium">Settled Outflows</span>
            <div className="text-xl font-headline font-bold text-status-error-text font-mono tabular-nums">
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : summary ? (
                formatINR(summary.outflow?.totalOutflow ?? summary.totalOutflows ?? 0)
              ) : (
                '—'
              )}
            </div>
          </div>
        </Card>

        {/* Pending Liabilities */}
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark-muted font-medium">Pending Liabilities</span>
            <div className="text-xl font-headline font-bold text-amber-400 font-mono tabular-nums">
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : summary ? (
                formatINR(
                  summary.pendingLiabilities?.totalPending ??
                    ((summary.totalPendingExpenses ?? 0) +
                      (summary.outstandingReimbursementObligations ?? 0))
                )
              ) : (
                '—'
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Review Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Expense Claims */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                Pending Expense Approvals
              </CardTitle>
              <Link to="/expenses" className="text-xs text-brand hover:underline font-medium">
                Full Queue
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : pendingExpenses.length === 0 ? (
              <div className="text-center py-6 text-xs text-dark-muted">
                No pending expenses requiring treasurer review.
              </div>
            ) : (
              pendingExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-lg bg-dark-canvas border border-dark-border/80 flex items-center justify-between gap-3 text-xs light:bg-light-elevated light:border-light-border"
                >
                  <div className="truncate">
                    <div className="font-semibold text-dark-text truncate light:text-light-text">
                      {exp.title}
                    </div>
                    <div className="text-[11px] text-dark-muted">
                      {exp.category} • Submitted {formatDate(exp.createdAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-dark-text light:text-light-text">
                      {formatINR(exp.amount)}
                    </div>
                    <Link to="/expenses">
                      <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 mt-1">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Unsettled Reimbursements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Approved Reimbursements Awaiting Settlement
              </CardTitle>
              <Link to="/treasury" className="text-xs text-brand hover:underline font-medium">
                View Ledger
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : pendingReimbursements.length === 0 ? (
              <div className="text-center py-6 text-xs text-dark-muted">
                No approved reimbursements awaiting bank settlement.
              </div>
            ) : (
              pendingReimbursements.map((reimb) => (
                <div
                  key={reimb.id}
                  className="p-3 rounded-lg bg-dark-canvas border border-dark-border/80 flex items-center justify-between gap-3 text-xs light:bg-light-elevated light:border-light-border"
                >
                  <div className="truncate">
                    <div className="font-semibold text-dark-text truncate light:text-light-text">
                      Claimant: {reimb.claimant?.name || 'Member'}
                    </div>
                    <div className="text-[11px] text-dark-muted">
                      Approved: {formatDate(reimb.reviewedAt || reimb.createdAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-emerald-400">
                      {formatINR(reimb.amount)}
                    </div>
                    <Badge status={reimb.status} className="mt-1" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
