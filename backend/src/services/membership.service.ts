import crypto from 'node:crypto';
import { Membership, MembershipStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedUser, hasPermission, UserRole } from '../types/auth.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import {
  ApplyMembershipInput,
  ListMembershipsQuery,
  MembershipPlanType,
  RenewMembershipInput,
} from '../validators/membership.validators.js';

export interface PlanConfig {
  name: string;
  durationDays: number;
  perks: string[];
}

export const PLAN_CONFIGS: Record<MembershipPlanType, PlanConfig> = {
  annual: {
    name: 'Annual Gold Member',
    durationDays: 365,
    perks: [
      'Free admission to general events',
      'Discounted Spring Gala ticket',
      '15% merchandise discount in the club shop',
      'Official scannable digital Member Pass',
    ],
  },
  semester: {
    name: 'Semester Member',
    durationDays: 120,
    perks: [
      'Discounted event tickets',
      '10% merchandise discount',
      'Official scannable digital Member Pass',
    ],
  },
  lifetime: {
    name: 'Alumni & Lifetime Pass',
    durationDays: 36500, // 100 years
    perks: [
      'All Gold member perks permanently',
      'Alumni networking receptions',
      'Name listed in Annual Gala program',
    ],
  },
};

function generateMemberCode(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `CF-${year}-${randomSuffix}`;
}

export async function applyForMembership(
  userId: string,
  input: ApplyMembershipInput | MembershipPlanType,
): Promise<Membership> {
  const planName = typeof input === 'string' ? input : input.planName;
  const adminNotes = typeof input === 'object' && input.notes ? input.notes : undefined;

  const plan = PLAN_CONFIGS[planName];
  if (!plan) {
    throw new BadRequestError(`Invalid planName: '${planName}'`);
  }

  // 1. Prevent duplicate active or pending memberships
  const existingActiveOrPending = await prisma.membership.findFirst({
    where: {
      userId,
      status: { in: [MembershipStatus.ACTIVE, MembershipStatus.PENDING] },
    },
  });

  if (existingActiveOrPending) {
    throw new BadRequestError(
      `User already has an active or pending membership (${existingActiveOrPending.status})`,
    );
  }

  const now = new Date();
  const validUntil = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  // Generate unique memberCode
  let memberCode = generateMemberCode();
  let attempts = 0;
  while (attempts < 5) {
    const codeExists = await prisma.membership.findUnique({ where: { memberCode } });
    if (!codeExists) break;
    memberCode = generateMemberCode();
    attempts++;
  }

  return prisma.membership.create({
    data: {
      userId,
      memberCode,
      planName,
      status: MembershipStatus.PENDING,
      startDate: now,
      validUntil,
      renewalCount: 0,
      perks: plan.perks,
      adminNotes: adminNotes ?? null,
    },
  });
}

export async function getOwnMembership(userId: string): Promise<Membership[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  for (const m of memberships) {
    if (m.status === MembershipStatus.ACTIVE && m.validUntil && m.validUntil.getTime() <= now) {
      await prisma.membership.update({
        where: { id: m.id },
        data: { status: MembershipStatus.EXPIRED },
      });
      m.status = MembershipStatus.EXPIRED;
    }
  }

  return memberships;
}

export async function getMembershipById(
  membershipId: string,
  userOrId: AuthenticatedUser | string,
  maybeRole?: UserRole,
): Promise<Membership & { user?: { id: string; name: string; email: string; role: string } }> {
  const currentUserId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  const userRole = typeof userOrId === 'string' ? maybeRole! : userOrId.role;

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!membership) {
    throw new NotFoundError('Membership record not found');
  }

  // Authorization check: Must be owner or have membership:read:any permission
  if (membership.userId !== currentUserId && !hasPermission(userRole, 'membership:read:any')) {
    throw new ForbiddenError('You do not have permission to view this membership record');
  }

  return membership;
}

export async function renewMembership(
  membershipId: string,
  userOrId: AuthenticatedUser | string,
  roleOrInput?: UserRole | RenewMembershipInput,
  maybePlanName?: MembershipPlanType,
): Promise<Membership> {
  let currentUserId: string;
  let userRole: UserRole;
  let targetPlanName: MembershipPlanType | undefined;

  if (typeof userOrId === 'string') {
    currentUserId = userOrId;
    userRole = roleOrInput as UserRole;
    targetPlanName = maybePlanName;
  } else {
    currentUserId = userOrId.id;
    userRole = userOrId.role;
    targetPlanName = (roleOrInput as RenewMembershipInput)?.planName;
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) {
    throw new NotFoundError('Membership record not found');
  }

  // Authorization check: Owner or admin
  if (membership.userId !== currentUserId && !hasPermission(userRole, 'membership:manage')) {
    throw new ForbiddenError('You do not have permission to renew this membership');
  }

  // State invariant: Only ACTIVE or EXPIRED memberships can be renewed
  if (
    membership.status !== MembershipStatus.ACTIVE &&
    membership.status !== MembershipStatus.EXPIRED
  ) {
    throw new BadRequestError(
      `Cannot renew membership with status '${membership.status}'. Only ACTIVE or EXPIRED memberships can be renewed.`,
    );
  }

  const finalPlanName = targetPlanName ?? (membership.planName as MembershipPlanType);
  const plan = PLAN_CONFIGS[finalPlanName] ?? PLAN_CONFIGS.annual;

  const now = new Date();
  const currentExpiry = membership.validUntil ? membership.validUntil.getTime() : 0;
  const baseDate = currentExpiry > now.getTime() ? membership.validUntil! : now;
  const newValidUntil = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  return prisma.membership.update({
    where: { id: membershipId },
    data: {
      planName: finalPlanName,
      status: MembershipStatus.ACTIVE,
      validUntil: newValidUntil,
      renewalCount: { increment: 1 },
      perks: plan.perks,
    },
  });
}

export async function updateMembershipStatus(
  membershipId: string,
  newStatus: MembershipStatus,
  adminNotes?: string,
): Promise<Membership> {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) {
    throw new NotFoundError('Membership record not found');
  }

  // Validate allowed state machine transitions
  const allowedTransitions: Record<MembershipStatus, MembershipStatus[]> = {
    [MembershipStatus.PENDING]: [MembershipStatus.ACTIVE, MembershipStatus.REJECTED],
    [MembershipStatus.ACTIVE]: [MembershipStatus.SUSPENDED, MembershipStatus.EXPIRED],
    [MembershipStatus.SUSPENDED]: [MembershipStatus.ACTIVE, MembershipStatus.EXPIRED],
    [MembershipStatus.EXPIRED]: [MembershipStatus.ACTIVE],
    [MembershipStatus.REJECTED]: [], // Cannot transition from rejected
  };

  const permitted = allowedTransitions[membership.status] ?? [];
  if (!permitted.includes(newStatus)) {
    throw new BadRequestError(
      `Invalid membership status transition from '${membership.status}' to '${newStatus}'.`,
    );
  }

  const dataToUpdate: Record<string, unknown> = {
    status: newStatus,
    adminNotes: adminNotes ?? membership.adminNotes,
  };

  if (newStatus === MembershipStatus.ACTIVE && membership.status === MembershipStatus.PENDING) {
    const plan = PLAN_CONFIGS[membership.planName as MembershipPlanType] ?? PLAN_CONFIGS.annual;
    const now = new Date();
    dataToUpdate.validUntil = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  }

  return prisma.membership.update({
    where: { id: membershipId },
    data: dataToUpdate,
  });
}

export async function listMemberships(query: ListMembershipsQuery): Promise<{
  memberships: Array<
    Membership & { user?: { id: string; name: string; email: string; role: string } }
  >;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const { status, planName, search, page = 1, limit = 20 } = query;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (planName) {
    where.planName = planName;
  }

  if (search) {
    where.OR = [
      { memberCode: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, memberships] = await Promise.all([
    prisma.membership.count({ where }),
    prisma.membership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    memberships,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
