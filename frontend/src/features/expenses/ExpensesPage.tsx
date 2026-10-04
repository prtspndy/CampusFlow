import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { expensesService } from '../../services/expenses.service';
import { reimbursementsService } from '../../services/reimbursements.service';
import {
  Expense,
  ExpenseCategory,
  Reimbursement,
} from '../../types/finance';
import { canReviewExpenses, canManageTreasury } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatINR, formatDate, formatDateTime } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Receipt,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Check,
  CreditCard,
  FileText,
} from 'lucide-react';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'TRAVEL', label: 'Travel & Transport' },
  { value: 'VENUE', label: 'Venue Booking' },
  { value: 'REFRESHMENTS', label: 'Refreshments & Food' },
  { value: 'EQUIPMENT', label: 'Equipment & AV' },
  { value: 'MARKETING', label: 'Marketing & Print' },
  { value: 'OTHER', label: 'Other Operational Expenses' },
];

export function ExpensesPage() {
  const { user } = useAuth();
  const canReview = canReviewExpenses(user);
  const canSettle = canManageTreasury(user);

  const [activeTab, setActiveTab] = useState<'my' | 'queue' | 'reimbursements'>('my');

  const [myExpenses, setMyExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Submit Expense Modal
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(250);
  const [category, setCategory] = useState<ExpenseCategory>('SUPPLIES');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdraw Expense Dialog
  const [withdrawTarget, setWithdrawTarget] = useState<Expense | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Reject Expense Modal
  const [rejectExpenseTarget, setRejectExpenseTarget] = useState<Expense | null>(null);
  const [rejectExpenseReason, setRejectExpenseReason] = useState('');
  const [isRejectingExpense, setIsRejectingExpense] = useState(false);

  // Settle Reimbursement Modal
  const [settleTarget, setSettleTarget] = useState<Reimbursement | null>(null);
  const [settleRef, setSettleRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Reject Reimbursement Modal
  const [rejectReimbTarget, setRejectReimbTarget] = useState<Reimbursement | null>(null);
  const [rejectReimbReason, setRejectReimbReason] = useState('');
  const [isRejectingReimb, setIsRejectingReimb] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'my') {
        const data = await expensesService.getMyExpenses();
        setMyExpenses(data || []);
      } else if (activeTab === 'queue' && canReview) {
        const res = await expensesService.listExpenses({ status: 'PENDING' });
        setAllExpenses(res.expenses || []);
      } else if (activeTab === 'reimbursements') {
        if (canSettle) {
          const res = await reimbursementsService.listReimbursements();
          setReimbursements(res.reimbursements || []);
        } else {
          const data = await reimbursementsService.getMyReimbursements();
          setReimbursements(data || []);
        }
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, canReview, canSettle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await expensesService.submitExpense({
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        category,
        expenseDate: new Date(expenseDate).toISOString(),
        receiptUrl: receiptUrl.trim() || undefined,
      });

      setIsSubmitOpen(false);
      resetSubmitForm();
      setFeedback({
        type: 'success',
        message: 'Expense claim submitted for treasurer audit.',
      });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmitForm = () => {
    setTitle('');
    setDescription('');
    setAmount(250);
    setCategory('SUPPLIES');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setReceiptUrl('');
  };

  // Withdraw Expense
  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    setIsWithdrawing(true);
    setFeedback(null);

    try {
      await expensesService.withdrawExpense(withdrawTarget.id);
      setWithdrawTarget(null);
      setFeedback({ type: 'success', message: 'Expense claim withdrawn.' });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Approve Expense
  const handleApproveExpense = async (exp: Expense) => {
    setFeedback(null);
    try {
      await expensesService.approveExpense(exp.id);
      setFeedback({
        type: 'success',
        message: `Approved "${exp.title}". A reimbursement claim has been queued.`,
      });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    }
  };

  // Reject Expense
  const handleConfirmRejectExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectExpenseTarget || !rejectExpenseReason.trim()) return;

    setIsRejectingExpense(true);
    setFeedback(null);

    try {
      await expensesService.rejectExpense(rejectExpenseTarget.id, rejectExpenseReason.trim());
      setRejectExpenseTarget(null);
      setRejectExpenseReason('');
      setFeedback({ type: 'success', message: 'Expense claim rejected with reason.' });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsRejectingExpense(false);
    }
  };

  // Settle Reimbursement
  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget || !settleRef.trim()) return;

    setIsSettling(true);
    setFeedback(null);

    try {
      await reimbursementsService.settleReimbursement(settleTarget.id, {
        settlementReference: settleRef.trim(),
        notes: settleNotes.trim() || undefined,
      });

      setSettleTarget(null);
      setSettleRef('');
      setSettleNotes('');
      setFeedback({
        type: 'success',
        message: 'Reimbursement marked as SETTLED. Outflow logged to general ledger.',
      });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsSettling(false);
    }
  };

  // Reject Reimbursement
  const handleConfirmRejectReimb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReimbTarget || !rejectReimbReason.trim()) return;

    setIsRejectingReimb(true);
    setFeedback(null);

    try {
      await reimbursementsService.rejectReimbursement(rejectReimbTarget.id, rejectReimbReason.trim());
      setRejectReimbTarget(null);
      setRejectReimbReason('');
      setFeedback({ type: 'success', message: 'Reimbursement rejected.' });
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsRejectingReimb(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border/60 light:border-light-border">
        <div>
          <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand" />
            Expenses & Reimbursements
          </h1>
          <p className="text-xs text-dark-muted light:text-light-muted mt-0.5">
            Submit expense receipts, audit claims, and manage bank settlements with strict separation of duties
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-dark-border p-0.5 bg-dark-canvas text-xs light:bg-light-elevated light:border-light-border">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-dark-muted hover:text-dark-text light:hover:text-light-text'
              }`}
            >
              My Claims
            </button>

            {canReview && (
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  activeTab === 'queue'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-dark-muted hover:text-dark-text light:hover:text-light-text'
                }`}
              >
                Review Queue
              </button>
            )}

            <button
              onClick={() => setActiveTab('reimbursements')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'reimbursements'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-dark-muted hover:text-dark-text light:hover:text-light-text'
              }`}
            >
              Reimbursements
            </button>
          </div>

          <Button size="sm" variant="primary" onClick={() => setIsSubmitOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Submit Expense
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-status-success-bg border border-status-success-border text-status-success-text'
              : 'bg-status-error-bg border border-status-error-border text-status-error-text'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* MY EXPENSES TAB */}
      {activeTab === 'my' && (
        <Card>
          <CardHeader>
            <CardTitle>My Submitted Expense Claims ({myExpenses.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : myExpenses.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Receipt}
                  title="No Expenses Filed"
                  description="You have not submitted any out-of-pocket expenses for reimbursement."
                  actionText="Submit First Expense"
                  onAction={() => setIsSubmitOpen(true)}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Title & Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expense Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {myExpenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <div className="font-semibold text-dark-text light:text-light-text">{exp.title}</div>
                        <p className="text-[11px] text-dark-muted line-clamp-1">{exp.description}</p>
                        {exp.receiptUrl && (
                          <a
                            href={exp.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-brand hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            View Receipt
                          </a>
                        )}
                        {exp.rejectionReason && (
                          <div className="text-[11px] text-status-error-text mt-1">
                            Reason: {exp.rejectionReason}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-dark-canvas border border-dark-border text-dark-text light:bg-light-elevated light:text-light-text">
                          {exp.category}
                        </span>
                      </TableCell>

                      <TableCell isMono>{formatINR(exp.amount)}</TableCell>
                      <TableCell>{formatDate(exp.expenseDate)}</TableCell>

                      <TableCell>
                        <Badge status={exp.status} />
                      </TableCell>

                      <TableCell align="right">
                        {exp.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="h-7 text-[11px] px-2"
                            onClick={() => setWithdrawTarget(exp)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Withdraw
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* REVIEW QUEUE TAB (STAFF) */}
      {activeTab === 'queue' && canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Claims Audit Queue ({allExpenses.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : allExpenses.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={CheckCircle}
                  title="Queue Clear"
                  description="All submitted expense claims have been audited and resolved."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Claim Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead align="right">Audit Decision</TableHead>
                </TableHeader>
                <TableBody>
                  {allExpenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <div className="font-semibold text-dark-text light:text-light-text">
                          {exp.submitter?.name || 'Student'}
                        </div>
                        <span className="text-[10px] text-dark-muted font-mono">{exp.submitter?.email}</span>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-dark-text light:text-light-text">{exp.title}</div>
                        <p className="text-[11px] text-dark-muted line-clamp-1">{exp.description}</p>
                      </TableCell>

                      <TableCell>{exp.category}</TableCell>
                      <TableCell isMono>{formatINR(exp.amount)}</TableCell>
                      <TableCell>{formatDate(exp.createdAt)}</TableCell>

                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => handleApproveExpense(exp)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="h-7 text-[11px] px-2.5"
                            onClick={() => {
                              setRejectExpenseTarget(exp);
                              setRejectExpenseReason('');
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* REIMBURSEMENTS TAB */}
      {activeTab === 'reimbursements' && (
        <Card>
          <CardHeader>
            <CardTitle>Reimbursement Claims ({reimbursements.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : reimbursements.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={CreditCard}
                  title="No Reimbursements"
                  description="No approved reimbursement disbursements are currently registered."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Linked Expense</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Settlement Reference</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {reimbursements.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-semibold text-dark-text light:text-light-text">
                          {r.claimant?.name || 'Member'}
                        </div>
                        <span className="text-[10px] text-dark-muted font-mono">{r.claimant?.email}</span>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-dark-text light:text-light-text">
                          {r.expense?.title || 'Approved Expense'}
                        </div>
                        <span className="text-[11px] text-dark-muted">{r.expense?.category}</span>
                      </TableCell>

                      <TableCell isMono>{formatINR(r.amount)}</TableCell>

                      <TableCell>
                        <Badge status={r.status} />
                      </TableCell>

                      <TableCell isMono>
                        {r.settlementReference || (
                          <span className="text-dark-muted italic">Pending Bank Transfer</span>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        {canSettle && (r.status === 'APPROVED' || r.status === 'PENDING') && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              className="h-7 text-[11px] px-2.5"
                              onClick={() => {
                                setSettleTarget(r);
                                setSettleRef(`UTR-${Date.now().toString().slice(-6)}`);
                              }}
                            >
                              Settle
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="h-7 text-[11px] px-2.5"
                              onClick={() => {
                                setRejectReimbTarget(r);
                                setRejectReimbReason('');
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Expense Modal */}
      {isSubmitOpen && (
        <Modal
          isOpen={isSubmitOpen}
          onClose={() => setIsSubmitOpen(false)}
          title="Submit Out-of-Pocket Expense"
          description="Log club expenditures with receipt verification for reimbursement"
          maxWidth="md"
        >
          <form onSubmit={handleSubmitExpense} className="space-y-4 pt-2">
            <Input
              label="Expense Title"
              required
              placeholder="e.g. Printing flyers for Spring Gala"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-dark-muted light:text-light-muted mb-1.5">
                Description of Expenditure <span className="text-status-error-text">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="What was purchased and how was it used for the club..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-white light:text-light-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Amount (₹)"
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />

              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                options={CATEGORIES}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date of Expense"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />

              <Input
                label="Receipt URL / Invoice Link"
                placeholder="https://..."
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-dark-border/60">
              <Button variant="ghost" size="sm" onClick={() => setIsSubmitOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Submit for Audit
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Withdraw Expense Dialog */}
      <ConfirmDialog
        isOpen={Boolean(withdrawTarget)}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleWithdraw}
        title="Withdraw Expense Claim"
        description={`Are you sure you want to withdraw "${withdrawTarget?.title}"? This pending claim will be permanently cancelled.`}
        confirmText="Withdraw Claim"
        variant="danger"
        isLoading={isWithdrawing}
      />

      {/* Reject Expense Modal */}
      {rejectExpenseTarget && (
        <Modal
          isOpen={Boolean(rejectExpenseTarget)}
          onClose={() => setRejectExpenseTarget(null)}
          title={`Reject Expense: ${rejectExpenseTarget.title}`}
          description="Please provide an authoritative justification for declining this expense claim."
        >
          <form onSubmit={handleConfirmRejectExpense} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-dark-muted light:text-light-muted mb-1.5">
                Rejection Reason <span className="text-status-error-text">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Missing itemized tax receipt, unapproved expenditure, duplicate filing..."
                value={rejectExpenseReason}
                onChange={(e) => setRejectExpenseReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-white light:text-light-text"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectExpenseTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" isLoading={isRejectingExpense}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Settle Reimbursement Modal */}
      {settleTarget && (
        <Modal
          isOpen={Boolean(settleTarget)}
          onClose={() => setSettleTarget(null)}
          title={`Settle Reimbursement — ${formatINR(settleTarget.amount)}`}
          description={`Recipient: ${settleTarget.claimant?.name || settleTarget.claimantId}`}
        >
          <form onSubmit={handleConfirmSettle} className="space-y-4 pt-2">
            <Input
              label="Bank / UPI Settlement UTR Reference"
              required
              placeholder="e.g. UTR-9821748912"
              value={settleRef}
              onChange={(e) => setSettleRef(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-dark-muted light:text-light-muted mb-1.5">
                Settlement Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Bank transfer notes or cheque number..."
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-white light:text-light-text"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSettleTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSettling}>
                Confirm Bank Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Reimbursement Modal */}
      {rejectReimbTarget && (
        <Modal
          isOpen={Boolean(rejectReimbTarget)}
          onClose={() => setRejectReimbTarget(null)}
          title="Reject Reimbursement Claim"
          description="Enter mandatory reason for settlement rejection"
        >
          <form onSubmit={handleConfirmRejectReimb} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-dark-muted light:text-light-muted mb-1.5">
                Reason for Rejection <span className="text-status-error-text">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Duplicate settlement, claimant payment details invalid..."
                value={rejectReimbReason}
                onChange={(e) => setRejectReimbReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded bg-dark-canvas text-dark-text border border-dark-border focus:outline-none focus:border-brand light:bg-white light:text-light-text"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectReimbTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" isLoading={isRejectingReimb}>
                Reject Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
