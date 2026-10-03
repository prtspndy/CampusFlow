import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireAnyPermission, requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { hasPermission } from '../types/auth.js';
import {
  createExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
  listLedgerQuerySchema,
  listReimbursementsQuerySchema,
  reimbursementIdParamSchema,
  rejectExpenseSchema,
  rejectReimbursementSchema,
  settleReimbursementSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type ListExpensesQuery,
  type ListLedgerQuery,
  type ListReimbursementsQuery,
  type RejectExpenseInput,
  type RejectReimbursementInput,
  type SettleReimbursementInput,
  type UpdateExpenseInput,
} from '../validators/finance.validators.js';
import {
  approveExpense,
  createExpense,
  getExpense,
  listExpenses,
  rejectExpense,
  updateExpense,
  withdrawExpense,
} from '../services/expense.service.js';
import {
  getReimbursement,
  listReimbursements,
  rejectReimbursement,
  settleReimbursement,
} from '../services/reimbursement.service.js';
import {
  exportLedgerCsv,
  getFinanceSummary,
  getLedgerTransactions,
} from '../services/finance-report.service.js';

export const expenseRouter = Router();
export const reimbursementRouter = Router();
export const financeReportRouter = Router();

// ==========================================
// 1. EXPENSE ENDPOINTS
// ==========================================

// Submit Expense
expenseRouter.post(
  '/',
  authenticate,
  requirePermission('finance.expenses.create'),
  validateBody(createExpenseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const expense = await createExpense(req.user!.id, req.body as CreateExpenseInput);
    return sendSuccess(res, expense, 'Expense submitted successfully', 201);
  }),
);

// My Submitted Expenses
expenseRouter.get(
  '/me',
  authenticate,
  requirePermission('finance.expenses.read_own'),
  asyncHandler(async (req: Request, res: Response) => {
    const expenses = await listExpenses({ page: 1, limit: 100 }, req.user!.id, false);
    return sendSuccess(res, expenses.expenses, 'My expenses retrieved successfully');
  }),
);

// List All Expenses (Staff / Reviewers)
expenseRouter.get(
  '/',
  authenticate,
  requireAnyPermission('finance.expenses.manage', 'finance.read'),
  validateQuery(listExpensesQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListExpensesQuery;
    const canManage = hasPermission(req.user!.role, 'finance.expenses.manage') || hasPermission(req.user!.role, 'finance.read');
    const result = await listExpenses(query, req.user!.id, canManage);
    return sendSuccess(res, result, 'Expenses retrieved successfully');
  }),
);

// Get Expense Details
expenseRouter.get(
  '/:id',
  authenticate,
  validateParams(expenseIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const canManage = hasPermission(req.user!.role, 'finance.expenses.manage') || hasPermission(req.user!.role, 'finance.read');
    const expense = await getExpense(req.params.id!, req.user!.id, canManage);
    return sendSuccess(res, expense, 'Expense details retrieved successfully');
  }),
);

// Update Pending Expense (Submitter only)
expenseRouter.patch(
  '/:id',
  authenticate,
  validateParams(expenseIdParamSchema),
  validateBody(updateExpenseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const expense = await updateExpense(
      req.params.id!,
      req.user!.id,
      req.body as UpdateExpenseInput,
    );
    return sendSuccess(res, expense, 'Expense updated successfully');
  }),
);

// Withdraw/Delete Pending Expense (Submitter only)
expenseRouter.delete(
  '/:id',
  authenticate,
  validateParams(expenseIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await withdrawExpense(req.params.id!, req.user!.id);
    return sendSuccess(res, result, 'Expense withdrawn successfully');
  }),
);

// Approve Expense (Staff)
expenseRouter.post(
  '/:id/approve',
  authenticate,
  requirePermission('finance.expenses.manage'),
  validateParams(expenseIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await approveExpense(req.params.id!, req.user!.id);
    return sendSuccess(res, result, 'Expense approved and reimbursement claim queued successfully');
  }),
);

// Reject Expense (Staff)
expenseRouter.post(
  '/:id/reject',
  authenticate,
  requirePermission('finance.expenses.manage'),
  validateParams(expenseIdParamSchema),
  validateBody(rejectExpenseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body as RejectExpenseInput;
    const result = await rejectExpense(req.params.id!, req.user!.id, reason);
    return sendSuccess(res, result, 'Expense rejected successfully');
  }),
);

// ==========================================
// 2. REIMBURSEMENT ENDPOINTS
// ==========================================

// My Reimbursements
reimbursementRouter.get(
  '/me',
  authenticate,
  requirePermission('reimbursements.read_own'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await listReimbursements({ page: 1, limit: 100 }, req.user!.id, false);
    return sendSuccess(res, result.reimbursements, 'My reimbursements retrieved successfully');
  }),
);

// List All Reimbursements (Staff)
reimbursementRouter.get(
  '/',
  authenticate,
  requireAnyPermission('reimbursements.read', 'finance.read'),
  validateQuery(listReimbursementsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListReimbursementsQuery;
    const canManage = hasPermission(req.user!.role, 'reimbursements.read') || hasPermission(req.user!.role, 'finance.read');
    const result = await listReimbursements(query, req.user!.id, canManage);
    return sendSuccess(res, result, 'Reimbursements retrieved successfully');
  }),
);

// Get Reimbursement Details
reimbursementRouter.get(
  '/:id',
  authenticate,
  validateParams(reimbursementIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const canManage = hasPermission(req.user!.role, 'reimbursements.read') || hasPermission(req.user!.role, 'finance.read');
    const reimbursement = await getReimbursement(req.params.id!, req.user!.id, canManage);
    return sendSuccess(res, reimbursement, 'Reimbursement details retrieved successfully');
  }),
);

// Settle Reimbursement (Authorized Finance Officer: Treasurer / Admin)
reimbursementRouter.post(
  '/:id/settle',
  authenticate,
  requirePermission('reimbursements.settle'),
  validateParams(reimbursementIdParamSchema),
  validateBody(settleReimbursementSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { settlementReference, notes } = req.body as SettleReimbursementInput;
    const result = await settleReimbursement(
      req.params.id!,
      req.user!.id,
      settlementReference,
      notes,
    );
    return sendSuccess(res, result, 'Reimbursement marked as settled successfully');
  }),
);

// Reject Reimbursement (Staff)
reimbursementRouter.post(
  '/:id/reject',
  authenticate,
  requirePermission('reimbursements.review'),
  validateParams(reimbursementIdParamSchema),
  validateBody(rejectReimbursementSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body as RejectReimbursementInput;
    const result = await rejectReimbursement(req.params.id!, req.user!.id, reason);
    return sendSuccess(res, result, 'Reimbursement rejected successfully');
  }),
);

// ==========================================
// 3. FINANCE DASHBOARD & REPORT ENDPOINTS
// ==========================================

// Financial Summary
financeReportRouter.get(
  '/summary',
  authenticate,
  requirePermission('finance.read'),
  asyncHandler(async (_req: Request, res: Response) => {
    const summary = await getFinanceSummary();
    return sendSuccess(res, summary, 'Finance summary retrieved successfully');
  }),
);

// General Ledger Transactions
financeReportRouter.get(
  '/ledger',
  authenticate,
  requirePermission('finance.read'),
  validateQuery(listLedgerQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListLedgerQuery;
    const ledger = await getLedgerTransactions(query);
    return sendSuccess(res, ledger, 'Ledger transactions retrieved successfully');
  }),
);

// CSV Export
financeReportRouter.get(
  '/export',
  authenticate,
  requirePermission('reports.finance.export'),
  asyncHandler(async (_req: Request, res: Response) => {
    const csv = await exportLedgerCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="campusflow_ledger_export.csv"');
    return res.status(200).send(csv);
  }),
);
