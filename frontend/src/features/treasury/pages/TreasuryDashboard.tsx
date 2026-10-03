import React, { useState } from 'react'
import {
  Download,
  PlusCircle,
} from 'lucide-react'
import { MOCK_LEDGER, MOCK_REIMBURSEMENTS } from '../../../lib/mockData'
import { StatTile } from '../../../components/cards/StatTile'
import { Button } from '../../../components/ui/Button'
import { StatusBadge } from '../../../components/badges/StatusBadge'
import { formatMoney } from '../../../lib/format'
import type { TransactionCategory } from '../../../types/enums'
import { cn } from '../../../lib/cn'

export const TreasuryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'reimbursements'>('ledger')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')

  // Calculate totals
  const totalIn = MOCK_LEDGER.filter((t) => t.amount > 0).reduce(
    (sum, t) => sum + t.amount,
    0
  )
  const totalOut = MOCK_LEDGER.filter((t) => t.amount < 0).reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  )
  const netBalance = totalIn - totalOut

  const categoryTints: Record<TransactionCategory, { bg: string; text: string; label: string }> = {
    DUES: {
      bg: 'var(--color-tint-sky)',
      text: 'var(--color-tint-sky-deep)',
      label: 'Dues',
    },
    TICKETS: {
      bg: 'var(--color-tint-peach)',
      text: 'var(--color-tint-peach-deep)',
      label: 'Tickets',
    },
    MERCH: {
      bg: 'var(--color-tint-mint)',
      text: 'var(--color-tint-mint-deep)',
      label: 'Merch',
    },
    FUNDRAISER: {
      bg: 'var(--color-tint-butter)',
      text: 'var(--color-tint-butter-deep)',
      label: 'Fundraiser',
    },
    EXPENSE: {
      bg: 'var(--color-tint-sage)',
      text: 'var(--color-tint-sage-deep)',
      label: 'Expenses',
    },
  }

  // Filtered ledger rows
  const filteredLedger = MOCK_LEDGER.filter(
    (t) => filterCategory === 'ALL' || t.category === filterCategory
  )

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Description,Category,Amount,Status']
        .concat(
          MOCK_LEDGER.map(
            (t) =>
              `${t.date},"${t.description}",${t.category},${t.amount},${t.status}`
          )
        )
        .join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'Skyline_Treasury_Semester_2026.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
            Reconciled accounting, expense audits, and semester export reports.
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
            <span>Export Semester (CSV)</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => alert('New transaction entry modal')}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Entry</span>
          </Button>
        </div>
      </div>

      {/* 3 Stat Tiles Trio per DESIGN.md: Money In, Money Out, Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Money In"
          value={formatMoney(totalIn, { showSign: true, isDelta: true })}
          delta="+₹20,958 this week"
          deltaType="positive"
        />
        <StatTile
          label="Money Out"
          value={formatMoney(totalOut, { showSign: true })}
          delta="−₹18,500 rental"
          deltaType="neutral"
        />
        <StatTile
          label="Total Balance"
          value={formatMoney(netBalance)}
          isNegativeBalance={netBalance < 0}
          delta="Audited & balanced"
          deltaType="positive"
        />
      </div>

      {/* Horizontal Stacked Bar Chart per DESIGN.md */}
      <div className="rounded-[14px] bg-[var(--color-surface)] p-5 border border-[var(--color-hairline)] space-y-3">
        <div className="flex items-center justify-between text-body-sm font-semibold text-[var(--color-ink)]">
          <span>Income & Allocation Breakdown</span>
          <span className="text-caption text-[var(--color-muted)]">By Source</span>
        </div>

        {/* Stacked bar in module tints */}
        <div className="h-5 w-full rounded-full overflow-hidden flex bg-[var(--color-surface-sunken)] p-0.5">
          <div
            style={{ width: '42%', backgroundColor: 'var(--color-tint-peach-deep)' }}
            className="h-full rounded-l-full"
            title="Tickets: 42%"
          />
          <div
            style={{ width: '28%', backgroundColor: 'var(--color-tint-sky-deep)' }}
            className="h-full"
            title="Dues: 28%"
          />
          <div
            style={{ width: '18%', backgroundColor: 'var(--color-tint-butter-deep)' }}
            className="h-full"
            title="Fundraisers: 18%"
          />
          <div
            style={{ width: '12%', backgroundColor: 'var(--color-tint-mint-deep)' }}
            className="h-full rounded-r-full"
            title="Merch: 12%"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-caption font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-tint-peach-deep)]" />
            <span>Tickets (42%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-tint-sky-deep)]" />
            <span>Member Dues (28%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-tint-butter-deep)]" />
            <span>Fundraisers (18%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-tint-mint-deep)]" />
            <span>Merch (12%)</span>
          </div>
        </div>
      </div>

      {/* Tabs: Ledger vs Reimbursements */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 border-b border-[var(--color-hairline)]">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={cn(
              'pb-3 text-body-sm font-semibold transition-colors border-b-2 cursor-pointer',
              activeTab === 'ledger'
                ? 'border-[var(--color-primary)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            Ledger Transactions ({MOCK_LEDGER.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reimbursements')}
            className={cn(
              'pb-3 text-body-sm font-semibold transition-colors border-b-2 cursor-pointer',
              activeTab === 'reimbursements'
                ? 'border-[var(--color-primary)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            Reimbursement Requests ({MOCK_REIMBURSEMENTS.length})
          </button>
        </div>

        {activeTab === 'ledger' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'TICKETS', 'DUES', 'EXPENSE', 'MERCH', 'FUNDRAISER'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-caption font-semibold transition-colors cursor-pointer select-none',
                    filterCategory === cat
                      ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-body)] border border-[var(--color-hairline)] hover:bg-[var(--color-surface-sunken)]'
                  )}
                >
                  {cat === 'ALL' ? 'All Transactions' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Ledger Table */}
            <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-hairline)] text-micro-uppercase text-[var(--color-muted)] font-bold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transaction Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)] text-body-sm">
                  {filteredLedger.map((row) => {
                    const isPositive = row.amount > 0
                    const conf = categoryTints[row.category as TransactionCategory] || categoryTints.EXPENSE
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[var(--color-surface)]/60 transition-colors h-14"
                      >
                        <td className="py-3 px-4 font-mono text-[13px] text-[var(--color-muted)] whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 font-medium text-[var(--color-ink)]">
                          {row.description}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            style={{ backgroundColor: conf.bg, color: conf.text }}
                            className="inline-block px-2.5 py-0.5 rounded-full text-caption font-semibold"
                          >
                            {conf.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-caption text-[var(--color-muted)]">
                          {row.sourceName || '—'}
                        </td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right font-bold text-money-md whitespace-nowrap',
                            isPositive
                              ? 'text-[var(--color-money-in)]'
                              : 'text-[var(--color-money-out)]'
                          )}
                        >
                          {formatMoney(row.amount, { showSign: true })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ) : (
          /* Reimbursements Review Flow */
          <div className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] divide-y divide-[var(--color-hairline)]">
            {MOCK_REIMBURSEMENTS.map((reimb) => {
              const statusVariant =
                reimb.status === 'PAID'
                  ? 'active'
                  : reimb.status === 'APPROVED'
                  ? 'expiring'
                  : 'neutral'

              return (
                <div
                  key={reimb.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface)] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-body-md text-[var(--color-ink)]">
                        {reimb.applicantName}
                      </span>
                      <StatusBadge variant={statusVariant} label={reimb.status} />
                    </div>
                    <p className="text-body-sm text-[var(--color-body)]">
                      {reimb.description}
                    </p>
                    <span className="text-caption text-[var(--color-muted)] block">
                      Submitted on{' '}
                      {new Date(reimb.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-money-lg font-bold text-[var(--color-ink)]">
                      {formatMoney(reimb.amount)}
                    </span>

                    {reimb.status === 'SUBMITTED' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => alert(`View receipt for ${reimb.applicantName}`)}
                        >
                          Receipt
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            alert(`Approved reimbursement of ${formatMoney(reimb.amount)}`)
                          }
                        >
                          Approve
                        </Button>
                      </div>
                    )}

                    {reimb.status === 'APPROVED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          alert(`Marked as Paid: ${formatMoney(reimb.amount)} transferred`)
                        }
                      >
                        Disburse Funds
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
