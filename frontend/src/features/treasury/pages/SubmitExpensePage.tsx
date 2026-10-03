import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Receipt,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { financeService } from '../../../services/financeService'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/Button'
import { formatMoney } from '../../../lib/format'
import { EmptyState } from '../../../components/feedback/EmptyState'
import type { Expense, ExpenseCategory } from '../../../types/models'
import { cn } from '../../../lib/cn'

export const SubmitExpensePage: React.FC = () => {
  const user = useAuthStore((state) => state.user)

  const [myExpenses, setMyExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [category, setCategory] = useState<ExpenseCategory>('SUPPLIES')
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [receiptUrl, setReceiptUrl] = useState('')

  const loadExpenses = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await financeService.listExpenses()
      // Filter for this user's submitted expenses
      const userExpenses = res.expenses.filter((e) => e.submitterId === user?.id)
      setMyExpenses(userExpenses)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load your submitted expenses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      void loadExpenses()
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please specify a positive expense amount.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      await financeService.submitExpense({
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        category,
        expenseDate: new Date(expenseDate).toISOString(),
        receiptUrl: receiptUrl.trim() || undefined,
      })

      setSuccessMsg('Expense successfully submitted for Treasurer review!')
      setTitle('')
      setDescription('')
      setAmount('')
      setReceiptUrl('')
      await loadExpenses()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-micro-uppercase font-bold tracking-wider text-[var(--color-tint-sage-deep)]">
            Member Treasury
          </span>
          <h1 className="text-heading-1 font-display font-extrabold text-[var(--color-ink)] mt-0.5">
            Submit Expense for Reimbursement
          </h1>
          <p className="text-body-sm text-[var(--color-muted)] mt-1">
            Request reimbursement for approved club purchases, supplies, travel, and venue rentals.
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Submission Form */}
        <div className="lg:col-span-5 rounded-[16px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
              New Expense Claim
            </h3>
            <p className="text-body-sm text-[var(--color-muted)] mt-0.5">
              Include purchase receipts or proof of payment for fast verification.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                Expense Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Paint & Banners for Welcome Week"
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Amount (INR) *
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1450"
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
                >
                  <option value="SUPPLIES">Supplies</option>
                  <option value="FOOD_BEVERAGE">Food & Beverage</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="VENUE">Venue</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                Date of Purchase *
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                Receipt or Invoice URL (Optional)
              </label>
              <input
                type="url"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://drive.google.com/... or receipt link"
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-body-sm font-semibold text-[var(--color-ink)]">
                Description & Justification *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this purchase was necessary for club operations..."
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[8px] text-body-sm"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting Claim...' : 'Submit Claim'}
            </Button>
          </form>
        </div>

        {/* My Submitted Expenses */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-heading-2 font-display font-bold text-[var(--color-ink)]">
            My Submitted Claims ({myExpenses.length})
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-[var(--color-surface)] rounded-[14px] animate-pulse" />
              ))}
            </div>
          ) : myExpenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-8 h-8" />}
              title="No expense claims submitted"
              description="When you submit club expense receipts, you can track Treasurer review and reimbursement payouts here."
            />
          ) : (
            <div className="space-y-3">
              {myExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-[14px] bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                        {exp.title}
                      </h4>
                      <p className="text-caption text-[var(--color-muted)]">
                        {exp.category} • {new Date(exp.expenseDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-heading-3 font-display font-bold text-[var(--color-ink)]">
                        {formatMoney(exp.amount)}
                      </span>
                    </div>
                  </div>

                  <p className="text-body-sm text-[var(--color-body)]">{exp.description}</p>

                  <div className="pt-2 border-t border-[var(--color-hairline)] flex flex-wrap items-center justify-between gap-3 text-caption">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-bold px-2.5 py-0.5 rounded-full uppercase',
                          exp.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exp.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {exp.status}
                      </span>

                      {exp.reimbursement && (
                        <span
                          className={cn(
                            'font-bold px-2 py-0.5 rounded-full uppercase text-[10px]',
                            exp.reimbursement.status === 'SETTLED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          )}
                        >
                          Payout: {exp.reimbursement.status}
                        </span>
                      )}
                    </div>

                    {exp.receiptUrl && (
                      <a
                        href={exp.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-primary)] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </a>
                    )}
                  </div>

                  {exp.rejectionReason && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-[8px] text-caption">
                      <strong>Rejection reason:</strong> {exp.rejectionReason}
                    </div>
                  )}

                  {exp.reimbursement?.settlementReference && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-[8px] text-caption">
                      <strong>Settled Reference:</strong> {exp.reimbursement.settlementReference} (Paid on{' '}
                      {new Date(exp.reimbursement.settledAt!).toLocaleDateString()})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
