import { prisma } from '../lib/prisma.js';
import {
  BadRequestError,
  NotFoundError,
} from '../utils/errors.js';
import type {
  CreateContributionInput,
  CreateFundraiserInput,
  ListContributionsQuery,
  ListFundraisersQuery,
  UpdateFundraiserInput,
  VerifyContributionInput,
} from '../validators/fundraiser.validators.js';
import {
  createRazorpayOrder,
  publicRazorpayKeyId,
  razorpayConfigured,
  verifyPaymentSignature,
} from '../lib/razorpay.js';
import { ContributionStatus, FundraiserStatus } from '@prisma/client';

export async function createFundraiser(creatorId: string, input: CreateFundraiserInput) {
  return await prisma.fundraiser.create({
    data: {
      title: input.title,
      description: input.description,
      purpose: input.purpose ?? null,
      goalAmount: input.goalAmount,
      currency: input.currency ?? 'INR',
      status: input.status ?? FundraiserStatus.DRAFT,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      deadline: input.deadline ? new Date(input.deadline) : null,
      beneficiary: input.beneficiary ?? null,
      creatorId,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getFundraiser(id: string, canManage: boolean) {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!fundraiser) {
    throw new NotFoundError('Fundraiser not found', 'FUNDRAISER_NOT_FOUND');
  }

  if (!canManage && fundraiser.status !== FundraiserStatus.ACTIVE) {
    throw new NotFoundError('Fundraiser not found', 'FUNDRAISER_NOT_FOUND');
  }

  const aggregates = await prisma.fundraiserContribution.aggregate({
    where: {
      fundraiserId: id,
      status: ContributionStatus.VERIFIED,
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const collectedAmount = aggregates._sum.amount ?? 0;
  const verifiedCount = aggregates._count.id ?? 0;

  return {
    ...fundraiser,
    collectedAmount,
    donorCount: verifiedCount,
    percentRaised: fundraiser.goalAmount > 0 ? Math.round((collectedAmount / fundraiser.goalAmount) * 100) : 0,
  };
}

export async function listFundraisers(query: ListFundraisersQuery, canManage: boolean) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (!canManage) {
    where.status = FundraiserStatus.ACTIVE;
  } else if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { purpose: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, fundraisers] = await Promise.all([
    prisma.fundraiser.count({ where }),
    prisma.fundraiser.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const items = await Promise.all(
    fundraisers.map(async (f) => {
      const aggregates = await prisma.fundraiserContribution.aggregate({
        where: {
          fundraiserId: f.id,
          status: ContributionStatus.VERIFIED,
        },
        _sum: { amount: true },
        _count: { id: true },
      });
      const collectedAmount = aggregates._sum.amount ?? 0;
      return {
        ...f,
        collectedAmount,
        donorCount: aggregates._count.id ?? 0,
        percentRaised: f.goalAmount > 0 ? Math.round((collectedAmount / f.goalAmount) * 100) : 0,
      };
    }),
  );

  return {
    fundraisers: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function updateFundraiser(id: string, input: UpdateFundraiserInput) {
  const existing = await prisma.fundraiser.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Fundraiser not found', 'FUNDRAISER_NOT_FOUND');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.purpose !== undefined) data.purpose = input.purpose;
  if (input.goalAmount !== undefined) data.goalAmount = input.goalAmount;
  if (input.startsAt !== undefined) data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  if (input.deadline !== undefined) data.deadline = input.deadline ? new Date(input.deadline) : null;
  if (input.beneficiary !== undefined) data.beneficiary = input.beneficiary;
  if (input.status !== undefined) data.status = input.status;

  return await prisma.fundraiser.update({
    where: { id },
    data,
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function setFundraiserStatus(id: string, status: FundraiserStatus) {
  const existing = await prisma.fundraiser.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Fundraiser not found', 'FUNDRAISER_NOT_FOUND');
  }

  return await prisma.fundraiser.update({
    where: { id },
    data: { status },
  });
}

export async function createContribution(
  fundraiserId: string,
  donorId: string | null,
  input: CreateContributionInput,
) {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
  });

  if (!fundraiser) {
    throw new NotFoundError('Fundraiser not found', 'FUNDRAISER_NOT_FOUND');
  }

  if (fundraiser.status !== FundraiserStatus.ACTIVE) {
    throw new BadRequestError('Fundraiser is not accepting contributions', [], 'FUNDRAISER_NOT_ACTIVE');
  }

  if (input.idempotencyKey) {
    const existing = await prisma.fundraiserContribution.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return {
        contribution: existing,
        razorpayOrderId: existing.razorpayOrderId,
        keyId: publicRazorpayKeyId(),
        alreadyExisted: true,
      };
    }
  }

  let razorpayOrderId: string | null = null;
  if (input.paymentMethod === 'ONLINE' && razorpayConfigured()) {
    try {
      const order = await createRazorpayOrder({
        amount: input.amount * 100, // paise
        currency: input.currency ?? 'INR',
        receipt: `cf_dn_${Date.now()}`,
        notes: {
          fundraiserId,
          donorEmail: input.donorEmail,
        },
      });
      razorpayOrderId = order.id;
    } catch {
      // In testing or provider failure, generate synthetic order ref
      razorpayOrderId = `order_test_${Date.now()}`;
    }
  }

  const contribution = await prisma.fundraiserContribution.create({
    data: {
      fundraiserId,
      donorId,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      amount: input.amount,
      currency: input.currency ?? 'INR',
      paymentMethod: input.paymentMethod,
      status: input.paymentMethod === 'CASH' || input.paymentMethod === 'DIRECT' ? ContributionStatus.VERIFIED : ContributionStatus.PENDING,
      razorpayOrderId,
      idempotencyKey: input.idempotencyKey ?? null,
      verifiedAt: input.paymentMethod === 'CASH' || input.paymentMethod === 'DIRECT' ? new Date() : null,
    },
  });

  return {
    contribution,
    razorpayOrderId,
    keyId: publicRazorpayKeyId(),
    alreadyExisted: false,
  };
}

export async function verifyContribution(input: VerifyContributionInput) {
  const contribution = await prisma.fundraiserContribution.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
    include: { fundraiser: true },
  });

  if (!contribution) {
    throw new NotFoundError('Contribution order not found', 'ORDER_NOT_FOUND');
  }

  if (contribution.status === ContributionStatus.VERIFIED) {
    return {
      contribution,
      verified: true,
      alreadyVerified: true,
    };
  }

  if (razorpayConfigured()) {
    const valid = verifyPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );
    if (!valid) {
      throw new BadRequestError('Invalid payment signature', [], 'INVALID_SIGNATURE');
    }
  }

  const updated = await prisma.fundraiserContribution.update({
    where: { id: contribution.id },
    data: {
      status: ContributionStatus.VERIFIED,
      razorpayPaymentId: input.razorpayPaymentId,
      verifiedAt: new Date(),
    },
    include: { fundraiser: true },
  });

  return {
    contribution: updated,
    verified: true,
    alreadyVerified: false,
  };
}

export async function listContributions(fundraiserId: string, query: ListContributionsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { fundraiserId };
  if (query.status) {
    where.status = query.status;
  }

  const [total, contributions] = await Promise.all([
    prisma.fundraiserContribution.count({ where }),
    prisma.fundraiserContribution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        donor: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    contributions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function listMyContributions(donorId: string) {
  return await prisma.fundraiserContribution.findMany({
    where: { donorId },
    orderBy: { createdAt: 'desc' },
    include: {
      fundraiser: {
        select: {
          id: true,
          title: true,
          goalAmount: true,
          currency: true,
          status: true,
        },
      },
    },
  });
}

export async function getFundraiserSummary(fundraiserId: string) {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
  });

  if (!fundraiser) {
    throw new NotFoundError('Fundraiser not found', 'FUNDRAISER_NOT_FOUND');
  }

  const [verifiedAgg, pendingCount, failedCount] = await Promise.all([
    prisma.fundraiserContribution.aggregate({
      where: { fundraiserId, status: ContributionStatus.VERIFIED },
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true },
    }),
    prisma.fundraiserContribution.count({
      where: { fundraiserId, status: ContributionStatus.PENDING },
    }),
    prisma.fundraiserContribution.count({
      where: { fundraiserId, status: ContributionStatus.FAILED },
    }),
  ]);

  const collectedAmount = verifiedAgg._sum.amount ?? 0;
  const verifiedCount = verifiedAgg._count.id ?? 0;
  const averageDonation = Math.round(verifiedAgg._avg.amount ?? 0);

  return {
    fundraiserId: fundraiser.id,
    title: fundraiser.title,
    goalAmount: fundraiser.goalAmount,
    collectedAmount,
    currency: fundraiser.currency,
    status: fundraiser.status,
    percentRaised: fundraiser.goalAmount > 0 ? Math.round((collectedAmount / fundraiser.goalAmount) * 100) : 0,
    donorCount: verifiedCount,
    verifiedCount,
    pendingCount,
    failedCount,
    averageDonation,
  };
}
