import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Receipt,
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
} from 'lucide-react'
import { financeService, type LedgerEntry } from '../../../services/financeService'
import { StatTile } from '../../../components/cards/StatTile'
import { Button } from '../../../components/ui/Button'
import { formatMoney } from '../../../lib/format'
import { EmptyState } from '../../../components/feedback/EmptyState'
import type {
  Expense,
  Reimbursement,
  FinanceSummaryData,
} from '../../../types/models'
import { cn } from '../../../lib/cn'

export const TreasuryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'expenses' | 'reimbursements' | 'reports'>('ledger')
  const [filterType, setFilterType] = useState<string>('ALL')

  // Live Backend Data
  const [summary, setSummary] = useState<FinanceSummaryData | null>(null)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [loading, setLoading] = useState(true)

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Expense Review Modal
  const [rejectingExpense, setRejectingExpense] = useState<Expense | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingReview, setProcessingReview] = useState(false)

  // Settle Reimbursement Modal
  const [settlingReimb, setSettlingReimb] = useState<Reimbursement | null>(null)
  const [settlementRef, setSettlementRef] = useState('')
  const [settlementNotes, setSettlementNotes] = useState('')
  const [processingSettle, setProcessingSettle] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [sumRes, ledgerRes, expRes, reimbRes] = await Promise.all([
        financeService.getFinanceSummary(),
        financeService.getLedger({ type: filterType === 'ALL' ? undefined : (filterType as any) }),
        financeService.listExpenses(),
        financeService.listReimbursements(),
      ])

      setSummary(sumRes)
      setLedgerEntries(ledgerRes.entries || [])
      setExpenses(expRes.expenses || [])
      setReimbursements(reimbRes.reimbursements || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load treasury data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [filterType])

  const handleExportCSV = async () => {
    setErrorMsg(null)
    try {
      const blob = await financeService.exportLedgerCsv({
        type: filterType === 'ALL' ? undefined : filterType,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CampusFlow_Treasury_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setSuccessMsg('Ledger CSV exported successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export CSV')
    }
  }

  const handleApproveExpense = async (expId: string) => {
    setProcessingReview(true)
    setErrorMsg(null)
    try {
      await financeService.reviewExpense(expId, { decision: 'APPROVE' })
      setSuccessMsg('Expense approved and queued for reimbursement payout!')
      await loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve expense')
    } finally {
      setProcessingReview(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectingExpense) return
    setProcessingReview(true)
    setErrorMsg(null)
    try {
      await financeService.reviewExpense(rejectingExpense.id, {
        decision: 'REJECT',
        rejectionReason: rejectionReason.trim() || undefined,
      })
      setSuccessMsg('Expense marked as rejected.')
      setRejectingExpense(null)
      setRejectionReason('')
      await loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject expense')
    } finally {
      setProcessingReview(false)
    }
  }

  const handleConfirmSettle = async () => {
    if (!settlingReimb) return
    setProcessingSettle(true)
    setErrorMsg(null)
    try {
      await financeService.settleReimbursement(settlingReimb.id, {
        settlementReference: settlementRef.trim() || undefined,
        notes: settlementNotes.trim() || undefined,
      })
      setSuccessMsg('Reimbursement payout confirmed and settled.')
      setSettlingReimb(null)
      setSettlementRef('')
      setSettlementNotes('')
      await loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record settlement')
    } finally {
      setProcessingSettle(false)
    }
  }

  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING')
  const pendingReimbursements = reimbursements.filter((r) => r.status === 'PENDING')

  const totalIn = summary?.totals.totalInflow ?? 0
  const totalOut = summary?.totals.totalOutflow ?? 0
  const netBalance = summary?.totals.netBalance ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-sage-deep)]">
            Financial Management
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Treasury & Ledger
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Reconciled accounting, audit logs, expense reviews, and verified payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Ledger (CSV)</span>
          </Button>

          <Link to="/member/expenses">
            <Button variant="primary" size="md" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>Submit Expense</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center justify-between text-body-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 rounded-[14px] bg-[var(--color-surface)]" />
            ))}
          </div>
          <div className="h-64 rounded-[14px] bg-[var(--color-surface)]" />
        </div>
      ) : (
        <>
          {/* 3 Stat Tiles Trio per DESIGN.md: Money In, Money Out, Total Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatTile
          label="Total Revenue"
          value={formatMoney(totalIn, { showSign: true, isDelta: true })}
          delta="Tickets, Merch, Fundraisers"
          deltaType="positive"
        />
        <StatTile
          label="Total Outflow"
          value={formatMoney(totalOut, { showSign: true })}
          delta="Settled Reimbursements"
          deltaType="neutral"
        />
        <StatTile
          label="Net Balance"
          value={formatMoney(netBalance)}
          isNegativeBalance={netBalance < 0}
          delta="Audited & Reconciled"
          deltaType={netBalance >= 0 ? 'positive' : 'negative'}
        />
        <StatTile
          label="Pending Approvals"
          value={formatMoney(summary?.totals.pendingExpensesAmount ?? 0)}
          delta={`${pendingExpenses.length} claims in queue`}
          deltaType="neutral"
        />
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-6 border-b border-[var(--color-hairline)] overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={cn(
              'pb-3 text-body-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap',
              activeTab === 'ledger'
                ? 'border-[var(--color-primary)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            Ledger Audit ({ledgerEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={cn(
              'pb-3 text-body-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2',
              activeTab === 'expenses'
                ? 'border-[var(--color-primary)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            <span>Review Queue</span>
            {pendingExpenses.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingExpenses.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reimbursements')}
            className={cn(
              'pb-3 text-body-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2',
              activeTab === 'reimbursements'
                ? 'border-[var(--color-primary)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            <span>Settlement Payouts</span>
            {pendingReimbursements.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white">
                {pendingReimbursements.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={cn(
              'pb-3 text-body-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap',
              activeTab === 'reports'
                ? 'border-[var(--color-primary)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            Financial Summary & Analytics
          </button>
        </div>

        {/* TAB 1: LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: 'All Transactions' },
                  { id: 'TICKET_SALES', label: 'Tickets' },
                  { id: 'MERCH_ORDERS', label: 'Merchandise' },
                  { id: 'CONTRIBUTIONS', label: 'Fundraisers' },
                  { id: 'REIMBURSEMENTS', label: 'Reimbursements' },
                  { id: 'EXPENSES', label: 'Approved Expenses' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterType(item.id)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-caption font-semibold transition-colors cursor-pointer whitespace-nowrap',
                      filterType === item.id
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)] border border-[var(--color-hairline)]'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <span className="text-caption text-[var(--color-muted)] font-medium">
                Showing {ledgerEntries.length} entries
              </span>
            </div>

            {ledgerEntries.length === 0 ? (
              <EmptyState
                icon={<FileSpreadsheet className="w-8 h-8" />}
                title="No transactions found"
                description="Transactions will automatically appear here as tickets, merchandise, fundraisers, and disbursements occur."
              />
            ) : (
              <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-body-sm">
                    <thead className="bg-[var(--color-surface)] border-b border-[var(--color-hairline)] text-caption font-bold text-[var(--color-muted)] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Party</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-hairline)]">
                      {ledgerEntries.map((row) => {
                        const isInflow = row.direction === 'INFLOW'
                        return (
                          <tr key={row.id} className="hover:bg-[var(--color-surface)]/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase',
                                  isInflow
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                )}
                              >
                                {isInflow ? (
                                  <ArrowDownLeft className="w-3 h-3" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3" />
                                )}
                                {row.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-caption text-[var(--color-muted)]">
                              {new Date(row.date).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[var(--color-ink)] max-w-sm">
                              <div>{row.description}</div>
                              <div className="text-[11px] text-[var(--color-muted)] font-normal">
                                Category: {row.category}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-caption text-[var(--color-muted)]">
                              {row.counterparty || 'CampusFlow System'}
                            </td>
                            <td
                              className={cn(
                                'py-3.5 px-4 text-right font-display font-bold text-body-md',
                                isInflow ? 'text-emerald-600' : 'text-red-600'
                              )}
                            >
                              {isInflow ? '+' : '−'}
                              {formatMoney(row.amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXPENSE REVIEW QUEUE */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <EmptyState
                icon={<Receipt className="w-8 h-8" />}
                title="No expense claims submitted"
                description="When members submit expense receipts, they will appear here for Treasurer approval."
              />
            ) : (
              <div className="space-y-4">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-caption font-bold px-2.5 py-0.5 rounded-full uppercase',
                              exp.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : exp.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            )}
                          >
                            {exp.status}
                          </span>
                          <span className="text-caption text-[var(--color-muted)]">
                            Submitted by {exp.submitter?.name} ({exp.submitter?.email}) on{' '}
                            {new Date(exp.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)] mt-1">
                          {exp.title}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
                          {formatMoney(exp.amount)}
                        </span>
                      </div>
                    </div>

                    <p className="text-body-sm text-[var(--color-body)]">{exp.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-hairline)] text-caption">
                      <div className="flex items-center gap-4 text-[var(--color-muted)]">
                        <span>Category: {exp.category}</span>
                        <span>Date: {new Date(exp.expenseDate).toLocaleDateString()}</span>
                        {exp.receiptUrl && (
                          <a
                            href={exp.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--color-primary)] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Attached Receipt</span>
                          </a>
                        )}
                      </div>

                      {exp.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveExpense(exp.id)}
                            disabled={processingReview}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1"
                          >
                            Approve Expense
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setRejectingExpense(exp)
                              setRejectionReason('')
                            }}
                            disabled={processingReview}
                            className="text-red-600 hover:text-red-700 text-xs py-1"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REIMBURSEMENT SETTLEMENTS */}
        {activeTab === 'reimbursements' && (
          <div className="space-y-4">
            {reimbursements.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="w-8 h-8" />}
                title="No reimbursement claims"
                description="Approved expenses automatically generate reimbursement records in this queue."
              />
            ) : (
              <div className="space-y-4">
                {reimbursements.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-caption font-bold px-2.5 py-0.5 rounded-full uppercase',
                              r.status === 'SETTLED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            )}
                          >
                            {r.status}
                          </span>
                          <span className="text-caption text-[var(--color-muted)]">
                            Claimant: {r.claimant?.name} ({r.claimant?.email})
                          </span>
                        </div>
                        <h4 className="text-heading-3 font-display font-bold text-[var(--color-ink)] mt-1">
                          {r.expense?.title || 'Reimbursement Claim'}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
                          {formatMoney(r.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-hairline)] text-caption">
                      <div className="text-[var(--color-muted)]">
                        {r.status === 'SETTLED' ? (
                          <span>
                            Settled on {new Date(r.settledAt!).toLocaleDateString()} • Ref:{' '}
                            <code className="text-[var(--color-ink)] font-bold">
                              {r.settlementReference || 'N/A'}
                            </code>
                          </span>
                        ) : (
                          <span>Awaiting disbursement by Treasurer</span>
                        )}
                      </div>

                      {r.status === 'PENDING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSettlingReimb(r)
                            setSettlementRef('')
                            setSettlementNotes('')
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-xs py-1"
                        >
                          Mark Settled & Record Reference
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPORTS & BREAKDOWN */}
        {activeTab === 'reports' && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 space-y-4">
              <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                Revenue Streams Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--color-surface)]">
                  <span>Ticket Sales ({summary.breakdown.tickets.count} orders)</span>
                  <span className="font-bold text-emerald-600">
                    +{formatMoney(summary.breakdown.tickets.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--color-surface)]">
                  <span>Merchandise Orders ({summary.breakdown.merchandise.count} sales)</span>
                  <span className="font-bold text-emerald-600">
                    +{formatMoney(summary.breakdown.merchandise.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--color-surface)]">
                  <span>Fundraiser Contributions ({summary.breakdown.fundraisers.count} donors)</span>
                  <span className="font-bold text-emerald-600">
                    +{formatMoney(summary.breakdown.fundraisers.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 space-y-4">
              <h3 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                Approved Expenses by Category
              </h3>
              {summary.expensesByCategory.length === 0 ? (
                <p className="text-body-sm text-[var(--color-muted)] italic">
                  No approved expenses recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.expensesByCategory.map((c) => (
                    <div
                      key={c.category}
                      className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--color-surface)]"
                    >
                      <span>
                        {c.category} ({c.count} items)
                      </span>
                      <span className="font-bold text-red-600">−{formatMoney(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Reject Expense Modal */}
      {rejectingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-canvas)] rounded-[16px] border border-[var(--color-hairline)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
                Reject Expense Claim
              </h3>
              <button
                type="button"
                onClick={() => setRejectingExpense(null)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-body-sm text-[var(--color-muted)]">
              Rejecting "{rejectingExpense.title}" for {formatMoney(rejectingExpense.amount)}.
            </p>

            <div className="space-y-1">
              <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this expense cannot be approved (e.g. Missing valid receipt)..."
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-hairline)]">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setRejectingExpense(null)}
                disabled={processingReview}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmReject}
                disabled={processingReview}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {processingReview ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Reimbursement Modal */}
      {settlingReimb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-canvas)] rounded-[16px] border border-[var(--color-hairline)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
                Confirm Settlement Payout
              </h3>
              <button
                type="button"
                onClick={() => setSettlingReimb(null)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-body-sm text-[var(--color-muted)]">
              Disbursing {formatMoney(settlingReimb.amount)} to {settlingReimb.claimant?.name}.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Settlement Transaction ID / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={settlementRef}
                  onChange={(e) => setSettlementRef(e.target.value)}
                  placeholder="e.g. UPI / NEFT / IMPS reference or check #"
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Treasurer Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  placeholder="e.g. Transferred via HDFC net banking"
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-hairline)]">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSettlingReimb(null)}
                disabled={processingSettle}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmSettle}
                disabled={processingSettle}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {processingSettle ? 'Recording...' : 'Mark as Settled'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
