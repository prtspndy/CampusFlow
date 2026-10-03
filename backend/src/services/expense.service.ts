import { prisma } from '../lib/prisma.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from '../validators/finance.validators.js';
import { ExpenseStatus, ReimbursementStatus } from '@prisma/client';

export async function createExpense(submitterId: string, input: CreateExpenseInput) {
  if (input.eventId) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) {
      throw new NotFoundError('Associated event not found', 'EVENT_NOT_FOUND');
    }
  }

  if (input.fundraiserId) {
    const fundraiser = await prisma.fundraiser.findUnique({ where: { id: input.fundraiserId } });
    if (!fundraiser) {
      throw new NotFoundError('Associated fundraiser not found', 'FUNDRAISER_NOT_FOUND');
    }
  }

  return await prisma.expense.create({
    data: {
      title: input.title,
      description: input.description,
      amount: input.amount,
      currency: input.currency ?? 'INR',
      category: input.category,
      expenseDate: new Date(input.expenseDate),
      receiptUrl: input.receiptUrl || null,
      eventId: input.eventId ?? null,
      fundraiserId: input.fundraiserId ?? null,
      submitterId,
      status: ExpenseStatus.PENDING,
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true } },
      fundraiser: { select: { id: true, title: true } },
    },
  });
}

export async function getExpense(id: string, currentUserId: string, canManage: boolean) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      submitter: { select: { id: true, name: true, email: true, role: true } },
      reviewer: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true } },
      fundraiser: { select: { id: true, title: true } },
      reimbursement: true,
    },
  });

  if (!expense) {
    throw new NotFoundError('Expense not found', 'EXPENSE_NOT_FOUND');
  }

  if (!canManage && expense.submitterId !== currentUserId) {
    throw new ForbiddenError('You can only view your own expenses', 'FORBIDDEN');
  }

  return expense;
}

export async function listExpenses(
  query: ListExpensesQuery,
  currentUserId: string,
  canManage: boolean,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (!canManage) {
    where.submitterId = currentUserId;
  } else if (query.submitterId) {
    where.submitterId = query.submitterId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.eventId) {
    where.eventId = query.eventId;
  }

  if (query.fundraiserId) {
    where.fundraiserId = query.fundraiserId;
  }

  if (query.startDate || query.endDate) {
    where.expenseDate = {};
    if (query.startDate) where.expenseDate.gte = new Date(query.startDate);
    if (query.endDate) where.expenseDate.lte = new Date(query.endDate);
  }

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { expenseDate: 'desc' },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
        reimbursement: { select: { id: true, status: true, settledAt: true } },
      },
    }),
  ]);

  return {
    expenses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function updateExpense(id: string, submitterId: string, input: UpdateExpenseInput) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Expense not found', 'EXPENSE_NOT_FOUND');
  }

  if (existing.submitterId !== submitterId) {
    throw new ForbiddenError('You can only edit your own expenses', 'FORBIDDEN');
  }

  if (existing.status !== ExpenseStatus.PENDING) {
    throw new BadRequestError(
      `Cannot edit expense with status ${existing.status}`,
      [],
      'INVALID_STATUS_TRANSITION',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.category !== undefined) data.category = input.category;
  if (input.expenseDate !== undefined) data.expenseDate = new Date(input.expenseDate);
  if (input.receiptUrl !== undefined) data.receiptUrl = input.receiptUrl || null;
  if (input.eventId !== undefined) data.eventId = input.eventId;
  if (input.fundraiserId !== undefined) data.fundraiserId = input.fundraiserId;

  return await prisma.expense.update({
    where: { id },
    data,
    include: {
      submitter: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function withdrawExpense(id: string, submitterId: string) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Expense not found', 'EXPENSE_NOT_FOUND');
  }

  if (existing.submitterId !== submitterId) {
    throw new ForbiddenError('You can only withdraw your own expenses', 'FORBIDDEN');
  }

  if (existing.status !== ExpenseStatus.PENDING) {
    throw new BadRequestError(
      `Cannot withdraw expense with status ${existing.status}`,
      [],
      'INVALID_STATUS_TRANSITION',
    );
  }

  await prisma.expense.delete({ where: { id } });
  return { id, withdrawn: true };
}

export async function approveExpense(id: string, reviewerId: string) {
  return await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new NotFoundError('Expense not found', 'EXPENSE_NOT_FOUND');
    }

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestError(
        `Cannot approve expense with status ${expense.status}`,
        [],
        'INVALID_STATUS_TRANSITION',
      );
    }

    if (expense.submitterId === reviewerId) {
      throw new ForbiddenError(
        'You cannot approve your own expense claim',
        'SELF_APPROVAL_FORBIDDEN',
      );
    }

    const updatedExpense = await tx.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.APPROVED,
        reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    // Create corresponding Reimbursement claim in PENDING state
    const reimbursement = await tx.reimbursement.create({
      data: {
        expenseId: expense.id,
        claimantId: expense.submitterId,
        amount: expense.amount,
        currency: expense.currency,
        status: ReimbursementStatus.PENDING,
      },
    });

    return {
      ...updatedExpense,
      reimbursement,
    };
  });
}

export async function rejectExpense(id: string, reviewerId: string, reason: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new NotFoundError('Expense not found', 'EXPENSE_NOT_FOUND');
  }

  if (expense.status !== ExpenseStatus.PENDING) {
    throw new BadRequestError(
      `Cannot reject expense with status ${expense.status}`,
      [],
      'INVALID_STATUS_TRANSITION',
    );
  }

  return await prisma.expense.update({
    where: { id },
    data: {
      status: ExpenseStatus.REJECTED,
      reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });
}
