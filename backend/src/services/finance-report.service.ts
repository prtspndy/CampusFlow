import { prisma } from '../lib/prisma.js';
import type { ListLedgerQuery } from '../validators/finance.validators.js';
import {
  ContributionStatus,
  ExpenseStatus,
  PaymentStatus,
  ReimbursementStatus,
} from '@prisma/client';

export async function getFinanceSummary() {
  const [
    approvedExpensesAgg,
    pendingExpensesAgg,
    rejectedExpensesAgg,
    settledReimbursementsAgg,
    pendingReimbursementsAgg,
    verifiedFundraiserAgg,
    ticketPaymentsAgg,
    merchOrdersAgg,
    expensesByCategoryRows,
    contributionsByFundraiserRows,
  ] = await Promise.all([
    prisma.expense.aggregate({
      where: { status: ExpenseStatus.APPROVED },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.aggregate({
      where: { status: ExpenseStatus.PENDING },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.aggregate({
      where: { status: ExpenseStatus.REJECTED },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.reimbursement.aggregate({
      where: { status: ReimbursementStatus.SETTLED },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.reimbursement.aggregate({
      where: { status: ReimbursementStatus.PENDING },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.fundraiserContribution.aggregate({
      where: { status: ContributionStatus.VERIFIED },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amountPaise: true },
      _count: { id: true },
    }),
    prisma.merchOrder.aggregate({
      where: { status: 'PLACED' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { status: ExpenseStatus.APPROVED },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.fundraiserContribution.groupBy({
      by: ['fundraiserId'],
      where: { status: ContributionStatus.VERIFIED },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalApprovedExpenses = approvedExpensesAgg._sum.amount ?? 0;
  const totalPendingExpenses = pendingExpensesAgg._sum.amount ?? 0;
  const totalRejectedExpenses = rejectedExpensesAgg._sum.amount ?? 0;

  const totalSettledReimbursements = settledReimbursementsAgg._sum.amount ?? 0;
  const outstandingReimbursementObligations = pendingReimbursementsAgg._sum.amount ?? 0;

  const totalVerifiedFundraiserContributions = verifiedFundraiserAgg._sum.amount ?? 0;
  const totalTicketRevenue = Math.round((ticketPaymentsAgg._sum.amountPaise ?? 0) / 100);
  const totalMerchRevenue = merchOrdersAgg._sum.totalAmount ?? 0;

  const totalInflows =
    totalVerifiedFundraiserContributions + totalTicketRevenue + totalMerchRevenue;
  const totalOutflows = totalSettledReimbursements;
  const netTreasuryBalance = totalInflows - totalOutflows;

  const expensesByCategory = expensesByCategoryRows.map((row) => ({
    category: row.category,
    amount: row._sum.amount ?? 0,
    count: row._count.id,
  }));

  // Resolve fundraiser titles for grouping
  const fundraiserIds = contributionsByFundraiserRows.map((r) => r.fundraiserId);
  const fundraisers = await prisma.fundraiser.findMany({
    where: { id: { in: fundraiserIds } },
    select: { id: true, title: true },
  });
  const fundraiserMap = new Map(fundraisers.map((f) => [f.id, f.title]));

  const contributionsByFundraiser = contributionsByFundraiserRows.map((row) => ({
    fundraiserId: row.fundraiserId,
    fundraiserTitle: fundraiserMap.get(row.fundraiserId) ?? 'Unknown Fundraiser',
    amount: row._sum.amount ?? 0,
    count: row._count.id,
  }));

  return {
    currency: 'INR',
    totalApprovedExpenses,
    totalPendingExpenses,
    totalRejectedExpenses,
    totalSettledReimbursements,
    outstandingReimbursementObligations,
    totalVerifiedFundraiserContributions,
    totalTicketRevenue,
    totalMerchRevenue,
    totalInflows,
    totalOutflows,
    netTreasuryBalance,
    expensesByCategory,
    contributionsByFundraiser,
  };
}

export interface LedgerItem {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number; // positive for inflows, negative for outflows
  status: string;
  source: string;
}

export async function getLedgerTransactions(query: ListLedgerQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  // Gather records from sources
  const [contributions, reimbursements, ticketPayments, merchOrders] = await Promise.all([
    prisma.fundraiserContribution.findMany({
      where: { status: ContributionStatus.VERIFIED },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { fundraiser: { select: { title: true } } },
    }),
    prisma.reimbursement.findMany({
      where: { status: ReimbursementStatus.SETTLED },
      orderBy: { settledAt: 'desc' },
      take: 100,
      include: { expense: { select: { title: true, category: true } } },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.PAID },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { event: { select: { title: true } } },
    }),
    prisma.merchOrder.findMany({
      where: { status: 'PLACED' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const items: LedgerItem[] = [];

  for (const c of contributions) {
    items.push({
      id: `contr-${c.id}`,
      date: (c.verifiedAt ?? c.createdAt).toISOString().slice(0, 10),
      description: `Fundraiser: ${c.fundraiser?.title ?? 'Donation'} (${c.donorName})`,
      category: 'FUNDRAISER',
      amount: c.amount,
      status: 'COMPLETED',
      source: c.fundraiser?.title ?? 'Fundraiser',
    });
  }

  for (const r of reimbursements) {
    items.push({
      id: `reimb-${r.id}`,
      date: (r.settledAt ?? r.createdAt).toISOString().slice(0, 10),
      description: `Reimbursement: ${r.expense?.title ?? 'Settled Claim'}`,
      category: 'EXPENSE',
      amount: -r.amount,
      status: 'COMPLETED',
      source: r.settlementReference ? `Ref #${r.settlementReference}` : 'Treasury',
    });
  }

  for (const p of ticketPayments) {
    items.push({
      id: `ticket-${p.id}`,
      date: p.createdAt.toISOString().slice(0, 10),
      description: `Ticket Sale: ${p.event?.title ?? 'Event'}`,
      category: 'TICKETS',
      amount: Math.round(p.amountPaise / 100),
      status: 'COMPLETED',
      source: p.event?.title ?? 'Ticketing',
    });
  }

  for (const o of merchOrders) {
    items.push({
      id: `order-${o.id}`,
      date: o.createdAt.toISOString().slice(0, 10),
      description: `Merch Order #${o.orderNumber}`,
      category: 'MERCH',
      amount: o.totalAmount,
      status: 'COMPLETED',
      source: 'Merch Store',
    });
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter if query specified
  let filtered = items;
  if (query.category && query.category !== 'ALL') {
    filtered = filtered.filter((i) => i.category === query.category);
  }
  if (query.startDate) {
    filtered = filtered.filter((i) => new Date(i.date) >= new Date(query.startDate!));
  }
  if (query.endDate) {
    filtered = filtered.filter((i) => new Date(i.date) <= new Date(query.endDate!));
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    transactions: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Sanitizes CSV cell values to prevent CSV formula injection (OWASP CSV Injection).
 * Any cell beginning with '=', '+', '-', '@', '\t', or '\r' is prefixed with a single quote (').
 * Double quotes are escaped according to RFC 4180.
 */
function sanitizeCsvCell(value: string): string {
  let safeValue = value;
  if (/^[=+\-@\t\r]/.test(safeValue)) {
    safeValue = `'${safeValue}`;
  } else if (/:\s*[=+\-@\t\r]/.test(safeValue)) {
    safeValue = safeValue.replace(/(:\s*)([=+\-@\t\r])/, "$1'$2");
  }
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export async function exportLedgerCsv() {
  const result = await getLedgerTransactions({ limit: 1000, page: 1 });
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Status', 'Source'];
  const rows = result.transactions.map((t) => [
    sanitizeCsvCell(t.date),
    sanitizeCsvCell(t.description),
    sanitizeCsvCell(t.category),
    t.amount.toString(),
    sanitizeCsvCell(t.status),
    sanitizeCsvCell(t.source),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
