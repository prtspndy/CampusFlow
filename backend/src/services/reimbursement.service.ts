import { prisma } from '../lib/prisma.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import type { ListReimbursementsQuery } from '../validators/finance.validators.js';
import { ReimbursementStatus } from '@prisma/client';

export async function getReimbursement(id: string, currentUserId: string, canManage: boolean) {
  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
    include: {
      claimant: { select: { id: true, name: true, email: true, role: true } },
      reviewer: { select: { id: true, name: true } },
      settledBy: { select: { id: true, name: true } },
      expense: {
        select: {
          id: true,
          title: true,
          description: true,
          amount: true,
          category: true,
          expenseDate: true,
          receiptUrl: true,
        },
      },
    },
  });

  if (!reimbursement) {
    throw new NotFoundError('Reimbursement not found', 'REIMBURSEMENT_NOT_FOUND');
  }

  if (!canManage && reimbursement.claimantId !== currentUserId) {
    throw new ForbiddenError('You can only view your own reimbursements', 'FORBIDDEN');
  }

  return reimbursement;
}

export async function listReimbursements(
  query: ListReimbursementsQuery,
  currentUserId: string,
  canManage: boolean,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (!canManage) {
    where.claimantId = currentUserId;
  } else if (query.claimantId) {
    where.claimantId = query.claimantId;
  }

  if (query.status) {
    where.status = query.status;
  }

  const [total, reimbursements] = await Promise.all([
    prisma.reimbursement.count({ where }),
    prisma.reimbursement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        claimant: { select: { id: true, name: true, email: true } },
        settledBy: { select: { id: true, name: true } },
        expense: { select: { id: true, title: true, category: true, expenseDate: true } },
      },
    }),
  ]);

  return {
    reimbursements,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function settleReimbursement(
  id: string,
  settledById: string,
  settlementReference: string,
  notes?: string,
) {
  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
  });

  if (!reimbursement) {
    throw new NotFoundError('Reimbursement not found', 'REIMBURSEMENT_NOT_FOUND');
  }

  if (reimbursement.status === ReimbursementStatus.SETTLED) {
    throw new BadRequestError('Reimbursement is already settled', [], 'ALREADY_SETTLED');
  }

  if (reimbursement.status === ReimbursementStatus.REJECTED) {
    throw new BadRequestError('Cannot settle a rejected reimbursement', [], 'INVALID_STATUS_TRANSITION');
  }

  if (reimbursement.claimantId === settledById) {
    throw new ForbiddenError(
      'You cannot settle your own reimbursement claim',
      'SELF_SETTLEMENT_FORBIDDEN',
    );
  }

  return await prisma.reimbursement.update({
    where: { id },
    data: {
      status: ReimbursementStatus.SETTLED,
      settledById,
      settledAt: new Date(),
      settlementReference,
      notes: notes ?? reimbursement.notes,
    },
    include: {
      claimant: { select: { id: true, name: true, email: true } },
      settledBy: { select: { id: true, name: true } },
      expense: { select: { id: true, title: true, amount: true } },
    },
  });
}

export async function rejectReimbursement(id: string, reviewerId: string, reason: string) {
  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
  });

  if (!reimbursement) {
    throw new NotFoundError('Reimbursement not found', 'REIMBURSEMENT_NOT_FOUND');
  }

  if (reimbursement.status === ReimbursementStatus.SETTLED) {
    throw new BadRequestError('Cannot reject an already settled reimbursement', [], 'ALREADY_SETTLED');
  }

  if (reimbursement.claimantId === reviewerId) {
    throw new ForbiddenError(
      'You cannot review your own reimbursement claim',
      'SELF_REVIEW_FORBIDDEN',
    );
  }

  return await prisma.reimbursement.update({
    where: { id },
    data: {
      status: ReimbursementStatus.REJECTED,
      reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
    include: {
      claimant: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });
}
