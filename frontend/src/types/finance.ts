import { User } from './auth';

export type ExpenseCategory =
  | 'SUPPLIES'
  | 'TRAVEL'
  | 'VENUE'
  | 'REFRESHMENTS'
  | 'EQUIPMENT'
  | 'MARKETING'
  | 'OTHER';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReimbursementStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED';

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expenseDate: string;
  receiptUrl?: string | null;
  status: ExpenseStatus;
  submitterId: string;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  eventId?: string | null;
  fundraiserId?: string | null;
  createdAt: string;
  updatedAt: string;
  submitter?: Pick<User, 'id' | 'name' | 'email'>;
  reviewer?: Pick<User, 'id' | 'name' | 'email'>;
  reimbursement?: Reimbursement;
}

export interface CreateExpenseInput {
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  receiptUrl?: string;
  eventId?: string;
  fundraiserId?: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {}

export interface Reimbursement {
  id: string;
  expenseId: string;
  claimantId: string;
  amount: number;
  currency: string;
  status: ReimbursementStatus;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  settledById?: string | null;
  settledAt?: string | null;
  settlementReference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  expense?: Expense;
  claimant?: Pick<User, 'id' | 'name' | 'email'>;
  settledBy?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface SettleReimbursementInput {
  settlementReference: string;
  notes?: string;
}

export interface RawFinanceSummary {
  currency: string;
  totalApprovedExpenses: number;
  totalPendingExpenses: number;
  totalRejectedExpenses: number;
  totalSettledReimbursements: number;
  outstandingReimbursementObligations: number;
  totalVerifiedFundraiserContributions: number;
  totalTicketRevenue: number;
  totalMerchRevenue: number;
  totalMembershipRevenue?: number;
  totalInflows: number;
  totalOutflows: number;
  netTreasuryBalance: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  contributionsByFundraiser: Array<{
    fundraiserId: string;
    fundraiserTitle: string;
    amount: number;
    count: number;
  }>;
}

export interface FinanceSummary extends Partial<RawFinanceSummary> {
  inflow: {
    eventRegistrations: number;
    fundraisers: number;
    memberships?: number;
    totalInflow: number;
  };
  outflow: {
    settledReimbursements: number;
    totalOutflow: number;
  };
  netBalance: number;
  pendingLiabilities: {
    pendingExpenses: number;
    unsettledReimbursements: number;
    totalPending: number;
  };
  categoryBreakdown: Record<string, number>;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  type?: 'INFLOW' | 'OUTFLOW';
  category: string;
  source: string;
  amount: number;
  currency?: string;
  description: string;
  referenceId?: string;
  status?: string;
}
