/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import { vi } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { normalizeRole, type AccountStatus, type UserRole } from '../../src/types/auth.js';
import {
  MembershipStatus,
  EventStatus,
  RegistrationStatus,
  PaymentStatus,
  TicketStatus,
  TicketTier,
  OpportunityStatus,
  VolunteerSignupStatus,
  FundraiserStatus,
  ContributionStatus,
  ExpenseStatus,
  ExpenseCategory,
  ReimbursementStatus,
} from '@prisma/client';

export interface MemoryUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  createdAt: Date;
  user?: MemoryUser;
}

export interface MemoryMembership {
  id: string;
  userId: string;
  planName: string;
  status: MembershipStatus;
  validUntil: Date | null;
  renewalCount: number;
  perks: string[];
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: MemoryUser;
}

export interface MemoryEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  imageUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  price: number;
  memberPrice: number;
  standardPrice: number;
  totalCapacity: number | null;
  registeredCount: number;
  isFeatured: boolean;
  status: EventStatus;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  organizer?: MemoryUser;
}

export interface MemoryRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  tier: TicketTier;
  quantity: number;
  amountPaise: number;
  currency: string;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryPayment {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  signatureVerifiedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryTicket {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: TicketStatus;
  verificationTokenHash: string;
  encryptedVerificationToken: string;
  issuedAt: Date;
  checkedInAt: Date | null;
  checkedInById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryCheckIn {
  id: string;
  ticketId: string;
  eventId: string;
  staffUserId: string;
  checkedInAt: Date;
}

export interface MemoryWebhookDelivery {
  id: string;
  eventType: string;
  razorpayOrderId: string | null;
  outcome: string;
  createdAt: Date;
}

const users: MemoryUser[] = [];
const refreshTokens: MemoryRefreshToken[] = [];
const memberships: MemoryMembership[] = [];
const events: MemoryEvent[] = [];
const registrations: MemoryRegistration[] = [];
const payments: MemoryPayment[] = [];
const tickets: MemoryTicket[] = [];
const checkIns: MemoryCheckIn[] = [];
const webhookDeliveries: MemoryWebhookDelivery[] = [];

export interface MemoryVariant {
  id: string;
  productId: string;
  size: string;
  stock: number;
}

export interface MemoryProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  sku: string | null;
  memberPrice: number;
  standardPrice: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryMerchOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PLACED' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  idempotencyKey: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryMerchItem {
  id: string;
  orderId: string;
  productId: string;
  size: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface MemoryAnnouncement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  status: 'DRAFT' | 'PUBLISHED';
  audience: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryVolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  applicationDeadline: Date | null;
  capacity: number;
  registeredCount: number;
  status: OpportunityStatus;
  category: string | null;
  eligibility: string | null;
  eventId: string | null;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryVolunteerRegistration {
  id: string;
  opportunityId: string;
  userId: string;
  status: VolunteerSignupStatus;
  notes: string | null;
  attendanceNotes: string | null;
  attendedAt: Date | null;
  attendedById: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryFundraiser {
  id: string;
  title: string;
  description: string;
  purpose: string | null;
  goalAmount: number;
  currency: string;
  status: FundraiserStatus;
  startsAt: Date | null;
  deadline: Date | null;
  beneficiary: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryFundraiserContribution {
  id: string;
  fundraiserId: string;
  donorId: string | null;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: ContributionStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  failureReason: string | null;
  verifiedAt: Date | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryExpense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expenseDate: Date;
  receiptUrl: string | null;
  status: ExpenseStatus;
  submitterId: string;
  reviewerId: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  eventId: string | null;
  fundraiserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryReimbursement {
  id: string;
  expenseId: string;
  claimantId: string;
  amount: number;
  currency: string;
  status: ReimbursementStatus;
  reviewerId: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  settledById: string | null;
  settledAt: Date | null;
  settlementReference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const products: MemoryProduct[] = [];
const variants: MemoryVariant[] = [];
const merchOrders: MemoryMerchOrder[] = [];
const merchItems: MemoryMerchItem[] = [];
const announcements: MemoryAnnouncement[] = [];
const volunteerOpportunities: MemoryVolunteerOpportunity[] = [];
const volunteerRegistrations: MemoryVolunteerRegistration[] = [];
const fundraisers: MemoryFundraiser[] = [];
const fundraiserContributions: MemoryFundraiserContribution[] = [];
const expenses: MemoryExpense[] = [];
const reimbursements: MemoryReimbursement[] = [];

let refreshReadWaiters: Array<() => void> | null = null;
let refreshReadTarget = 0;
let transactionQueue: Promise<void> = Promise.resolve();

export function resetMemoryDb(): void {
  users.length = 0;
  refreshTokens.length = 0;
  memberships.length = 0;
  events.length = 0;
  registrations.length = 0;
  payments.length = 0;
  tickets.length = 0;
  checkIns.length = 0;
  webhookDeliveries.length = 0;
  products.length = 0;
  variants.length = 0;
  merchOrders.length = 0;
  merchItems.length = 0;
  announcements.length = 0;
  volunteerOpportunities.length = 0;
  volunteerRegistrations.length = 0;
  fundraisers.length = 0;
  fundraiserContributions.length = 0;
  expenses.length = 0;
  reimbursements.length = 0;
  refreshReadWaiters = null;
  refreshReadTarget = 0;
  transactionQueue = Promise.resolve();
}

/**
 * Test-only gate for the in-memory fake. The next `count` refresh-token reads
 * wait until all of them have observed the row, then continue. This lets two
 * rotations pass the initial read before either conditional update runs.
 * It does not exercise PostgreSQL locking.
 */
export function overlapNextRefreshTokenReads(count: number): void {
  refreshReadWaiters = [];
  refreshReadTarget = count;
}

export function memoryUsers(): MemoryUser[] {
  return users.map((user) => ({ ...user }));
}

export function memoryRefreshTokens(): MemoryRefreshToken[] {
  return refreshTokens.map((token) => ({ ...token }));
}

export function memoryMemberships(): MemoryMembership[] {
  return memberships.map((membership) => ({ ...membership }));
}

export function memoryEvents(): MemoryEvent[] {
  return events.map((event) => ({ ...event }));
}

export function memoryRegistrations(): MemoryRegistration[] {
  return registrations.map((row) => ({ ...row }));
}

export function memoryPayments(): MemoryPayment[] {
  return payments.map((row) => ({ ...row }));
}

export function memoryTickets(): MemoryTicket[] {
  return tickets.map((row) => ({ ...row }));
}

export function memoryCheckIns(): MemoryCheckIn[] {
  return checkIns.map((row) => ({ ...row }));
}

export function insertRegistration(
  partial: Partial<MemoryRegistration> &
    Pick<MemoryRegistration, 'eventId' | 'userId' | 'status' | 'tier' | 'amountPaise'>,
): MemoryRegistration {
  const now = new Date();
  const row: MemoryRegistration = {
    id: partial.id ?? crypto.randomUUID(),
    eventId: partial.eventId,
    userId: partial.userId,
    status: partial.status,
    tier: partial.tier,
    quantity: partial.quantity ?? 1,
    amountPaise: partial.amountPaise,
    currency: partial.currency ?? 'INR',
    cancelledAt: partial.cancelledAt ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  registrations.push(row);
  return { ...row };
}

export function insertTicket(
  partial: Partial<MemoryTicket> &
    Pick<
      MemoryTicket,
      | 'registrationId'
      | 'eventId'
      | 'userId'
      | 'verificationTokenHash'
      | 'encryptedVerificationToken'
    >,
): MemoryTicket {
  const now = new Date();
  const row: MemoryTicket = {
    id: partial.id ?? crypto.randomUUID(),
    registrationId: partial.registrationId,
    eventId: partial.eventId,
    userId: partial.userId,
    status: partial.status ?? TicketStatus.ISSUED,
    verificationTokenHash: partial.verificationTokenHash,
    encryptedVerificationToken: partial.encryptedVerificationToken,
    issuedAt: partial.issuedAt ?? now,
    checkedInAt: partial.checkedInAt ?? null,
    checkedInById: partial.checkedInById ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  tickets.push(row);
  return { ...row };
}

export function insertPayment(
  partial: Partial<MemoryPayment> &
    Pick<MemoryPayment, 'registrationId' | 'eventId' | 'userId' | 'amountPaise'>,
): MemoryPayment {
  const now = new Date();
  const row: MemoryPayment = {
    id: partial.id ?? crypto.randomUUID(),
    registrationId: partial.registrationId,
    eventId: partial.eventId,
    userId: partial.userId,
    razorpayOrderId: partial.razorpayOrderId ?? null,
    razorpayPaymentId: partial.razorpayPaymentId ?? null,
    amountPaise: partial.amountPaise,
    currency: partial.currency ?? 'INR',
    status: partial.status ?? PaymentStatus.CREATED,
    signatureVerifiedAt: partial.signatureVerifiedAt ?? null,
    failureReason: partial.failureReason ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  payments.push(row);
  return { ...row };
}

export function insertUser(
  partial: Partial<MemoryUser> & Pick<MemoryUser, 'email' | 'name' | 'passwordHash'>,
): MemoryUser {
  const now = new Date();
  const rawRole = partial.role ?? 'MEMBER';
  const role: UserRole = normalizeRole(rawRole);
  const user: MemoryUser = {
    id: partial.id ?? crypto.randomUUID(),
    email: partial.email,
    name: partial.name,
    passwordHash: partial.passwordHash,
    role,
    status: partial.status ?? 'active',
    tokenVersion: partial.tokenVersion ?? 0,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  users.push(user);
  return { ...user };
}

export function insertMembership(
  partial: Partial<MemoryMembership> & Pick<MemoryMembership, 'userId' | 'planName'>,
): MemoryMembership {
  const now = new Date();
  const membership: MemoryMembership = {
    id: partial.id ?? crypto.randomUUID(),
    userId: partial.userId,
    planName: partial.planName,
    status: partial.status ?? MembershipStatus.PENDING,
    validUntil: partial.validUntil ?? null,
    renewalCount: partial.renewalCount ?? 0,
    perks: partial.perks ?? [],
    adminNotes: partial.adminNotes ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  memberships.push(membership);
  return { ...membership };
}

export function insertEvent(
  partial: Partial<MemoryEvent> &
    Pick<
      MemoryEvent,
      | 'title'
      | 'description'
      | 'category'
      | 'venue'
      | 'startsAt'
      | 'endsAt'
      | 'capacity'
      | 'organizerId'
    >,
): MemoryEvent {
  const now = new Date();
  const price = partial.price ?? 0;
  const event: MemoryEvent = {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title,
    description: partial.description,
    category: partial.category,
    venue: partial.venue,
    imageUrl: partial.imageUrl ?? null,
    startsAt: partial.startsAt,
    endsAt: partial.endsAt,
    capacity: partial.capacity,
    price,
    memberPrice: partial.memberPrice ?? price,
    standardPrice: partial.standardPrice ?? price,
    totalCapacity: partial.totalCapacity === undefined ? partial.capacity : partial.totalCapacity,
    registeredCount: partial.registeredCount ?? 0,
    isFeatured: partial.isFeatured ?? false,
    status: partial.status ?? EventStatus.DRAFT,
    organizerId: partial.organizerId,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  events.push(event);
  return { ...event };
}

export function insertAnnouncement(
  partial: Partial<MemoryAnnouncement> & Pick<MemoryAnnouncement, 'title' | 'body' | 'authorId'>,
): MemoryAnnouncement {
  const now = new Date();
  const row: MemoryAnnouncement = {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title,
    body: partial.body,
    authorId: partial.authorId,
    status: partial.status ?? 'DRAFT',
    audience: partial.audience ?? 'ALL_MEMBERS',
    publishedAt: partial.publishedAt ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  announcements.push(row);
  return { ...row };
}

export function expireRefreshTokens(): void {
  const expiredAt = new Date(Date.now() - 1000);
  for (const token of refreshTokens) {
    token.expiresAt = expiredAt;
  }
}

export function setUserStatus(email: string, status: AccountStatus): void {
  const user = users.find((entry) => entry.email === email);
  if (!user) {
    throw new Error(`No memory user for ${email}`);
  }
  user.status = status;
}

function snapshotState() {
  return {
    users: users.map((user) => ({ ...user })),
    refreshTokens: refreshTokens.map((token) => ({ ...token })),
    memberships: memberships.map((m) => ({ ...m })),
    events: events.map((e) => ({ ...e })),
    registrations: registrations.map((row) => ({ ...row })),
    payments: payments.map((row) => ({ ...row })),
    tickets: tickets.map((row) => ({ ...row })),
    checkIns: checkIns.map((row) => ({ ...row })),
    webhookDeliveries: webhookDeliveries.map((row) => ({ ...row })),
    products: products.map((row) => ({ ...row })),
    variants: variants.map((row) => ({ ...row })),
    merchOrders: merchOrders.map((row) => ({ ...row })),
    merchItems: merchItems.map((row) => ({ ...row })),
    announcements: announcements.map((row) => ({ ...row })),
    volunteerOpportunities: volunteerOpportunities.map((row) => ({ ...row })),
    volunteerRegistrations: volunteerRegistrations.map((row) => ({ ...row })),
    fundraisers: fundraisers.map((row) => ({ ...row })),
    fundraiserContributions: fundraiserContributions.map((row) => ({ ...row })),
    expenses: expenses.map((row) => ({ ...row })),
    reimbursements: reimbursements.map((row) => ({ ...row })),
  };
}

function restoreState(state: ReturnType<typeof snapshotState>): void {
  users.splice(0, users.length, ...state.users.map((user) => ({ ...user })));
  refreshTokens.splice(
    0,
    refreshTokens.length,
    ...state.refreshTokens.map((token) => ({ ...token })),
  );
  memberships.splice(0, memberships.length, ...state.memberships.map((m) => ({ ...m })));
  events.splice(0, events.length, ...state.events.map((e) => ({ ...e })));
  registrations.splice(0, registrations.length, ...state.registrations.map((row) => ({ ...row })));
  payments.splice(0, payments.length, ...state.payments.map((row) => ({ ...row })));
  tickets.splice(0, tickets.length, ...state.tickets.map((row) => ({ ...row })));
  checkIns.splice(0, checkIns.length, ...state.checkIns.map((row) => ({ ...row })));
  webhookDeliveries.splice(
    0,
    webhookDeliveries.length,
    ...state.webhookDeliveries.map((row) => ({ ...row })),
  );
  products.splice(0, products.length, ...state.products.map((row) => ({ ...row })));
  variants.splice(0, variants.length, ...state.variants.map((row) => ({ ...row })));
  merchOrders.splice(0, merchOrders.length, ...state.merchOrders.map((row) => ({ ...row })));
  merchItems.splice(0, merchItems.length, ...state.merchItems.map((row) => ({ ...row })));
  announcements.splice(
    0,
    announcements.length,
    ...state.announcements.map((row) => ({ ...row })),
  );
  volunteerOpportunities.splice(
    0,
    volunteerOpportunities.length,
    ...state.volunteerOpportunities.map((row) => ({ ...row })),
  );
  volunteerRegistrations.splice(
    0,
    volunteerRegistrations.length,
    ...state.volunteerRegistrations.map((row) => ({ ...row })),
  );
  fundraisers.splice(
    0,
    fundraisers.length,
    ...state.fundraisers.map((row) => ({ ...row })),
  );
  fundraiserContributions.splice(
    0,
    fundraiserContributions.length,
    ...state.fundraiserContributions.map((row) => ({ ...row })),
  );
  expenses.splice(
    0,
    expenses.length,
    ...state.expenses.map((row) => ({ ...row })),
  );
  reimbursements.splice(
    0,
    reimbursements.length,
    ...state.reimbursements.map((row) => ({ ...row })),
  );
}

function uniqueError(): Error {
  const error = new Error('Unique constraint failed') as Error & { code: string };
  error.code = 'P2002';
  return error;
}

function matchesPrimitive(actual: unknown, filter: unknown): boolean {
  if (filter === undefined) return true;
  if (filter === null) return actual === null;
  if (typeof filter !== 'object' || filter instanceof Date) {
    if (actual instanceof Date && (filter instanceof Date || typeof filter === 'string')) {
      return actual.getTime() === new Date(filter as Date).getTime();
    }
    return actual === filter;
  }
  const ops = filter as Record<string, unknown>;
  if (Array.isArray(ops.in)) return ops.in.includes(actual);
  if ('gt' in ops) {
    if (actual instanceof Date) return actual.getTime() > new Date(ops.gt as Date).getTime();
    return typeof actual === 'number' && actual > Number(ops.gt);
  }
  if ('gte' in ops) return typeof actual === 'number' && actual >= Number(ops.gte);
  if ('lte' in ops) return typeof actual === 'number' && actual <= Number(ops.lte);
  if ('lt' in ops) return typeof actual === 'number' && actual < Number(ops.lt);
  if (typeof ops.contains === 'string') {
    return (
      typeof actual === 'string' && actual.toLowerCase().includes(ops.contains.toLowerCase())
    );
  }
  return false;
}

function matchesWhere(record: Record<string, unknown>, where?: Record<string, unknown>): boolean {
  if (!where) return true;
  if (Array.isArray(where.AND) && !where.AND.every((clause) => matchesWhere(record, clause))) {
    return false;
  }
  if (Array.isArray(where.OR) && !where.OR.some((clause) => matchesWhere(record, clause))) {
    return false;
  }
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND' || key === 'OR') return true;
    return matchesPrimitive(record[key], value);
  });
}

function applyPatch(target: Record<string, any>, data: Record<string, any>): void {
  for (const [key, value] of Object.entries(data)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      (typeof value.increment === 'number' || typeof value.decrement === 'number')
    ) {
      const current = typeof target[key] === 'number' ? target[key] : 0;
      if (typeof value.increment === 'number') target[key] = current + value.increment;
      if (typeof value.decrement === 'number') target[key] = current - value.decrement;
      continue;
    }
    target[key] = value;
  }
  if (data.startsAt) target.startsAt = new Date(data.startsAt);
  if (data.endsAt) target.endsAt = new Date(data.endsAt);
  if (data.checkedInAt) target.checkedInAt = new Date(data.checkedInAt);
  if (data.cancelledAt) target.cancelledAt = new Date(data.cancelledAt);
  if (data.signatureVerifiedAt) target.signatureVerifiedAt = new Date(data.signatureVerifiedAt);
  target.updatedAt = new Date();
}

export function installPrismaMemory(): void {
  vi.spyOn(prisma, '$transaction').mockImplementation((callback: unknown) => {
    if (typeof callback !== 'function') {
      return Promise.reject(new Error('Expected an interactive transaction')) as never;
    }
    const run = async () => {
      const snapshot = snapshotState();
      try {
        return await (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
      } catch (error) {
        restoreState(snapshot);
        throw error;
      }
    };
    // The refresh-token overlap test needs two transactions to read before either writes.
    if (refreshReadWaiters) {
      return run() as never;
    }
    const queued = transactionQueue.then(run, run);
    transactionQueue = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued as never;
  });

  vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args) => {
    const where = args.where as { id?: string; email?: string };
    const user = users.find((entry) =>
      where.id ? entry.id === where.id : entry.email === where.email,
    );
    return (user ? { ...user } : null) as never;
  });

  vi.spyOn(prisma.user, 'create').mockImplementation(async (args) => {
    const data = args.data as MemoryUser;
    if (users.some((entry) => entry.email === data.email)) {
      const error = new Error('Unique constraint failed') as Error & { code: string };
      error.code = 'P2002';
      throw error;
    }
    return insertUser(data) as never;
  });

  vi.spyOn(prisma.user, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as {
      name?: string;
      role?: UserRole;
      tokenVersion?: { increment?: number };
    };
    const user = users.find((entry) => entry.id === where.id);
    if (!user) {
      const error = new Error('Record not found') as Error & { code: string };
      error.code = 'P2025';
      throw error;
    }
    if (typeof data.name === 'string') {
      user.name = data.name;
    }
    if (data.role) {
      user.role = normalizeRole(data.role);
    }
    if (data.tokenVersion?.increment) {
      user.tokenVersion += data.tokenVersion.increment;
    }
    user.updatedAt = new Date();
    return { ...user } as never;
  });

  vi.spyOn(prisma.user, 'count').mockImplementation(async (args) => {
    const where = args?.where as any;
    const matches = users.filter((u) => {
      if (where?.role && u.role !== normalizeRole(where.role)) return false;
      if (where?.status && u.status !== where.status) return false;
      return true;
    });
    return matches.length as never;
  });

  vi.spyOn(prisma.user, 'findMany').mockImplementation(async () => {
    return [...users]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((user) => ({ ...user })) as never;
  });

  vi.spyOn(prisma.refreshToken, 'create').mockImplementation(async (args) => {
    const data = args.data as Omit<
      MemoryRefreshToken,
      'id' | 'createdAt' | 'revokedAt' | 'replacedById'
    >;
    const token: MemoryRefreshToken = {
      id: crypto.randomUUID(),
      userId: data.userId,
      tokenHash: data.tokenHash,
      familyId: data.familyId,
      expiresAt: data.expiresAt,
      revokedAt: null,
      replacedById: null,
      createdAt: new Date(),
    };
    refreshTokens.push(token);
    return { ...token } as never;
  });

  vi.spyOn(prisma.refreshToken, 'findUnique').mockImplementation(async (args) => {
    const where = args.where as { tokenHash: string };
    const token = refreshTokens.find((entry) => entry.tokenHash === where.tokenHash);
    if (refreshReadWaiters && refreshReadTarget > 0) {
      await new Promise<void>((resolve) => {
        refreshReadWaiters?.push(resolve);
        if (refreshReadWaiters && refreshReadWaiters.length >= refreshReadTarget) {
          const pending = refreshReadWaiters;
          refreshReadWaiters = null;
          refreshReadTarget = 0;
          pending.forEach((release) => release());
        }
      });
    }
    if (!token) {
      return null;
    }
    const user = users.find((entry) => entry.id === token.userId);
    return { ...token, user: user ? { ...user } : null } as never;
  });

  vi.spyOn(prisma.refreshToken, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as { revokedAt?: Date; replacedById?: string };
    const token = refreshTokens.find((entry) => entry.id === where.id);
    if (!token) {
      throw new Error('Refresh token not found');
    }
    if (data.revokedAt) {
      token.revokedAt = data.revokedAt;
    }
    if (data.replacedById) {
      token.replacedById = data.replacedById;
    }
    return { ...token } as never;
  });

  vi.spyOn(prisma.refreshToken, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as {
      id?: string;
      familyId?: string;
      userId?: string;
      revokedAt?: null;
    };
    const data = args.data as { revokedAt?: Date };
    let count = 0;
    for (const token of refreshTokens) {
      const idMatches = where.id ? token.id === where.id : true;
      const familyMatches = where.familyId ? token.familyId === where.familyId : true;
      const userMatches = where.userId ? token.userId === where.userId : true;
      const activeMatches = where.revokedAt === null ? token.revokedAt === null : true;
      if (idMatches && familyMatches && userMatches && activeMatches) {
        if (data.revokedAt) {
          token.revokedAt = data.revokedAt;
        }
        count += 1;
      }
    }
    return { count } as never;
  });

  // Membership Mocks
  vi.spyOn(prisma.membership, 'findFirst').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = memberships.find((m) => {
      if (where?.userId && m.userId !== where.userId) return false;
      if (where?.status) {
        if (typeof where.status === 'string' && m.status !== where.status) return false;
        if (where.status?.in && !where.status.in.includes(m.status)) return false;
      }
      if (where?.validUntil?.gt) {
        if (!m.validUntil || m.validUntil.getTime() <= new Date(where.validUntil.gt).getTime()) {
          return false;
        }
      }
      return true;
    });
    return (match ? { ...match } : null) as never;
  });

  vi.spyOn(prisma.membership, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = memberships.find((m) => m.id === where.id);
    if (!match) return null as never;
    const user = users.find((u) => u.id === match.userId);
    return {
      ...match,
      ...(args?.include?.user ? { user: user ? { ...user } : undefined } : {}),
    } as never;
  });

  vi.spyOn(prisma.membership, 'findMany').mockImplementation(async (args) => {
    const where = args?.where as any;
    let matches = memberships.filter((m) => {
      if (where?.userId && m.userId !== where.userId) return false;
      if (where?.status && m.status !== where.status) return false;
      if (where?.planName && m.planName !== where.planName) return false;
      return true;
    });
    if (args?.orderBy?.createdAt === 'desc') {
      matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    matches = matches.slice(skip, skip + take);
    return matches.map((m) => {
      const user = users.find((u) => u.id === m.userId);
      return {
        ...m,
        ...(args?.include?.user ? { user: user ? { ...user } : undefined } : {}),
      };
    }) as never;
  });

  vi.spyOn(prisma.membership, 'count').mockImplementation(async (args) => {
    const where = args?.where as any;
    const matches = memberships.filter((m) => {
      if (where?.userId && m.userId !== where.userId) return false;
      if (where?.status && m.status !== where.status) return false;
      if (where?.planName && m.planName !== where.planName) return false;
      return true;
    });
    return matches.length as never;
  });

  vi.spyOn(prisma.membership, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const membership: MemoryMembership = {
      id: data.id ?? crypto.randomUUID(),
      userId: data.userId,
      planName: data.planName,
      status: data.status,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      renewalCount: data.renewalCount ?? 0,
      perks: data.perks ?? [],
      adminNotes: data.adminNotes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    memberships.push(membership);
    return { ...membership } as never;
  });

  vi.spyOn(prisma.membership, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as any;
    const match = memberships.find((m) => m.id === where.id);
    if (!match) {
      const err = new Error('Membership record not found') as Error & { code: string };
      err.code = 'P2025';
      throw err;
    }
    if (data.status) match.status = data.status;
    if (data.planName) match.planName = data.planName;
    if (data.validUntil !== undefined)
      match.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (data.adminNotes !== undefined) match.adminNotes = data.adminNotes;
    if (data.perks) match.perks = data.perks;
    if (data.renewalCount?.increment) match.renewalCount += data.renewalCount.increment;
    match.updatedAt = new Date();
    return { ...match } as never;
  });

  // Event Mocks
  vi.spyOn(prisma.event, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const price = data.standardPrice ?? data.price ?? 0;
    const event: MemoryEvent = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      description: data.description,
      category: data.category ?? '',
      venue: data.venue,
      imageUrl: data.imageUrl ?? null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      capacity: data.capacity ?? data.totalCapacity ?? 0,
      price,
      memberPrice: data.memberPrice ?? 0,
      standardPrice: price,
      totalCapacity:
        data.totalCapacity === undefined ? (data.capacity ?? null) : data.totalCapacity,
      registeredCount: data.registeredCount ?? 0,
      isFeatured: data.isFeatured ?? false,
      status: data.status ?? EventStatus.DRAFT,
      organizerId: data.organizerId,
      createdAt: now,
      updatedAt: now,
    };
    events.push(event);
    return { ...event } as never;
  });

  vi.spyOn(prisma.event, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = events.find((e) => e.id === where.id);
    if (!match) return null as never;
    const organizer = users.find((u) => u.id === match.organizerId);
    return {
      ...match,
      ...(args?.include?.organizer ? { organizer: organizer ? { ...organizer } : undefined } : {}),
    } as never;
  });

  vi.spyOn(prisma.event, 'findMany').mockImplementation(async (args) => {
    const where = args?.where as any;
    let matches = events.filter((e) => {
      if (where?.status && e.status !== where.status) return false;
      if (where?.category && e.category !== where.category) return false;
      if (where?.organizerId && e.organizerId !== where.organizerId) return false;
      if (where?.startsAt?.gte && e.startsAt < new Date(where.startsAt.gte)) return false;
      if (where?.startsAt?.lte && e.startsAt > new Date(where.startsAt.lte)) return false;
      if (where?.OR && Array.isArray(where.OR)) {
        const orMatched = where.OR.some((clause: any) => {
          if (clause.title?.contains)
            return e.title.toLowerCase().includes(clause.title.contains.toLowerCase());
          if (clause.description?.contains)
            return e.description.toLowerCase().includes(clause.description.contains.toLowerCase());
          if (clause.venue?.contains)
            return e.venue.toLowerCase().includes(clause.venue.contains.toLowerCase());
          return false;
        });
        if (!orMatched) return false;
      }
      return true;
    });
    if (args?.orderBy?.startsAt === 'asc') {
      matches.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    matches = matches.slice(skip, skip + take);
    return matches.map((e) => {
      const organizer = users.find((u) => u.id === e.organizerId);
      return {
        ...e,
        ...(args?.include?.organizer
          ? { organizer: organizer ? { ...organizer } : undefined }
          : {}),
      };
    }) as never;
  });

  vi.spyOn(prisma.event, 'count').mockImplementation(async (args) => {
    const where = args?.where as any;
    const matches = events.filter((e) => {
      if (where?.status && e.status !== where.status) return false;
      if (where?.category && e.category !== where.category) return false;
      if (where?.organizerId && e.organizerId !== where.organizerId) return false;
      if (where?.startsAt?.gte && e.startsAt < new Date(where.startsAt.gte)) return false;
      if (where?.startsAt?.lte && e.startsAt > new Date(where.startsAt.lte)) return false;
      if (where?.OR && Array.isArray(where.OR)) {
        const orMatched = where.OR.some((clause: any) => {
          if (clause.title?.contains)
            return e.title.toLowerCase().includes(clause.title.contains.toLowerCase());
          if (clause.description?.contains)
            return e.description.toLowerCase().includes(clause.description.contains.toLowerCase());
          if (clause.venue?.contains)
            return e.venue.toLowerCase().includes(clause.venue.contains.toLowerCase());
          return false;
        });
        if (!orMatched) return false;
      }
      return true;
    });
    return matches.length as never;
  });

  vi.spyOn(prisma.event, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as any;
    const match = events.find((e) => e.id === where.id);
    if (!match) {
      const err = new Error('Event not found') as Error & { code: string };
      err.code = 'P2025';
      throw err;
    }
    applyPatch(match, data);
    return { ...match } as never;
  });

  vi.spyOn(prisma.event, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as Record<string, unknown>;
    const data = args.data as Record<string, unknown>;
    let count = 0;
    for (const event of events) {
      if (!matchesWhere(event as unknown as Record<string, unknown>, where)) continue;
      applyPatch(event as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  const presentRegistration = (row: MemoryRegistration, include?: any) => {
    const result: any = { ...row };
    if (include?.user) {
      const user = users.find((entry) => entry.id === row.userId);
      result.user = user ? { id: user.id, name: user.name, email: user.email } : null;
    }
    if (include?.event === true || include?.event) {
      result.event = events.find((event) => event.id === row.eventId) ?? null;
    }
    if (include?.ticket) {
      result.ticket = tickets.find((ticket) => ticket.registrationId === row.id) ?? null;
    }
    if (include?.tickets) {
      result.tickets = tickets.filter((ticket) => ticket.registrationId === row.id);
    }
    return result;
  };

  vi.spyOn(prisma.eventRegistration, 'findFirst').mockImplementation(async (args) => {
    const match = registrations.find((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    return (match ? { ...match } : null) as never;
  });

  vi.spyOn(prisma.eventRegistration, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = registrations.find((row) => row.id === where.id);
    if (!match) return null as never;
    return presentRegistration(match, args?.include) as never;
  });

  vi.spyOn(prisma.eventRegistration, 'findMany').mockImplementation(async (args) => {
    let matches = registrations.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.createdAt === 'desc') {
      matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches
      .slice(skip, skip + take)
      .map((row) => presentRegistration(row, args?.include)) as never;
  });

  vi.spyOn(prisma.eventRegistration, 'count').mockImplementation(async (args) => {
    return registrations.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.eventRegistration, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const active = registrations.some(
      (row) =>
        row.eventId === data.eventId &&
        row.userId === data.userId &&
        (row.status === RegistrationStatus.PENDING_PAYMENT ||
          row.status === RegistrationStatus.CONFIRMED) &&
        (data.status === RegistrationStatus.PENDING_PAYMENT ||
          data.status === RegistrationStatus.CONFIRMED),
    );
    if (active) throw uniqueError();
    const now = new Date();
    const row: MemoryRegistration = {
      id: data.id ?? crypto.randomUUID(),
      eventId: data.eventId,
      userId: data.userId,
      status: data.status,
      tier: data.tier,
      quantity: data.quantity ?? 1,
      amountPaise: data.amountPaise,
      currency: data.currency ?? 'INR',
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
    registrations.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.eventRegistration, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    const data = args.data as any;
    let count = 0;
    for (const row of registrations) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  vi.spyOn(prisma.payment, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = payments.find((row) => {
      if (where.id) return row.id === where.id;
      if (where.razorpayOrderId) return row.razorpayOrderId === where.razorpayOrderId;
      if (where.razorpayPaymentId) return row.razorpayPaymentId === where.razorpayPaymentId;
      return false;
    });
    return (match ? { ...match } : null) as never;
  });

  vi.spyOn(prisma.payment, 'findFirst').mockImplementation(async (args) => {
    let matches = payments.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.createdAt === 'desc') {
      matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return (matches[0] ? { ...matches[0] } : null) as never;
  });

  const presentPayment = (row: MemoryPayment, args?: any) => {
    const include = args?.include;
    const result: any = { ...row };
    if (include?.user) {
      const user = users.find((entry) => entry.id === row.userId);
      result.user = user ? { id: user.id, name: user.name, email: user.email } : null;
    }
    if (include?.event) {
      const event = events.find((entry) => entry.id === row.eventId);
      result.event = event ? { id: event.id, title: event.title } : null;
    }
    return result;
  };

  vi.spyOn(prisma.payment, 'findMany').mockImplementation(async (args) => {
    let matches = payments.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.createdAt === 'desc') {
      matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map((row) => presentPayment(row, args)) as never;
  });

  vi.spyOn(prisma.payment, 'count').mockImplementation(async (args) => {
    return payments.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.payment, 'aggregate').mockImplementation(async (args) => {
    const matches = payments.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const sum = matches.reduce((acc, curr) => acc + (curr.amountPaise ?? 0), 0);
    const count = matches.length;
    return {
      _sum: { amountPaise: sum },
      _count: { id: count },
    } as never;
  });

  vi.spyOn(prisma.payment, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (
      data.razorpayOrderId &&
      payments.some((row) => row.razorpayOrderId === data.razorpayOrderId)
    ) {
      throw uniqueError();
    }
    if (
      data.razorpayPaymentId &&
      payments.some((row) => row.razorpayPaymentId === data.razorpayPaymentId)
    ) {
      throw uniqueError();
    }
    const sameRegistration = payments.filter((row) => row.registrationId === data.registrationId);
    if (
      (data.status === PaymentStatus.CREATED || data.status === PaymentStatus.PENDING) &&
      sameRegistration.some(
        (row) => row.status === PaymentStatus.CREATED || row.status === PaymentStatus.PENDING,
      )
    ) {
      throw uniqueError();
    }
    if (
      (data.status === PaymentStatus.PAID || data.status === PaymentStatus.REFUNDED) &&
      sameRegistration.some(
        (row) => row.status === PaymentStatus.PAID || row.status === PaymentStatus.REFUNDED,
      )
    ) {
      throw uniqueError();
    }
    const now = new Date();
    const row: MemoryPayment = {
      id: data.id ?? crypto.randomUUID(),
      registrationId: data.registrationId,
      eventId: data.eventId,
      userId: data.userId,
      razorpayOrderId: data.razorpayOrderId ?? null,
      razorpayPaymentId: data.razorpayPaymentId ?? null,
      amountPaise: data.amountPaise,
      currency: data.currency ?? 'INR',
      status: data.status ?? PaymentStatus.CREATED,
      signatureVerifiedAt: null,
      failureReason: data.failureReason ?? null,
      createdAt: now,
      updatedAt: now,
    };
    payments.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.payment, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = payments.find((row) => row.id === where.id);
    if (!match) {
      const error = new Error('Payment not found') as Error & { code: string };
      error.code = 'P2025';
      throw error;
    }
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return { ...match } as never;
  });

  vi.spyOn(prisma.payment, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    const data = args.data as any;
    let count = 0;
    for (const row of payments) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  const presentTicket = (row: MemoryTicket, args?: any) => {
    const include = args?.include;
    const result: any = { ...row };
    if (include?.user) {
      const user = users.find((entry) => entry.id === row.userId);
      result.user = user ? { id: user.id, name: user.name, email: user.email } : null;
    }
    if (include?.registration) {
      result.registration = registrations.find((entry) => entry.id === row.registrationId) ?? null;
    }
    if (include?.event) {
      const event = events.find((entry) => entry.id === row.eventId);
      result.event = event ? { ...event } : null;
    }
    return result;
  };

  vi.spyOn(prisma.ticket, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = tickets.find((row) => {
      if (where.id) return row.id === where.id;
      if (where.registrationId) return row.registrationId === where.registrationId;
      if (where.verificationTokenHash)
        return row.verificationTokenHash === where.verificationTokenHash;
      return false;
    });
    return (match ? presentTicket(match, args) : null) as never;
  });

  vi.spyOn(prisma.ticket, 'findMany').mockImplementation(async (args) => {
    let matches = tickets.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.issuedAt === 'desc') {
      matches = [...matches].sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map((row) => presentTicket(row, args)) as never;
  });

  vi.spyOn(prisma.ticket, 'count').mockImplementation(async (args) => {
    return tickets.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.ticket, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (tickets.some((row) => row.verificationTokenHash === data.verificationTokenHash)) {
      throw uniqueError();
    }
    const now = new Date();
    const row: MemoryTicket = {
      id: data.id ?? crypto.randomUUID(),
      registrationId: data.registrationId,
      eventId: data.eventId,
      userId: data.userId,
      status: data.status ?? TicketStatus.ISSUED,
      verificationTokenHash: data.verificationTokenHash,
      encryptedVerificationToken: data.encryptedVerificationToken,
      issuedAt: now,
      checkedInAt: null,
      checkedInById: null,
      createdAt: now,
      updatedAt: now,
    };
    tickets.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.ticket, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    const data = args.data as any;
    let count = 0;
    for (const row of tickets) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  vi.spyOn(prisma.checkIn, 'count').mockImplementation(async (args) => {
    return checkIns.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.checkIn, 'findMany').mockImplementation(async (args) => {
    let matches = checkIns.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.checkedInAt === 'desc') {
      matches = [...matches].sort((a, b) => b.checkedInAt.getTime() - a.checkedInAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map((row) => {
      const ticket = tickets.find((entry) => entry.id === row.ticketId);
      const holder = ticket ? users.find((entry) => entry.id === ticket.userId) : undefined;
      const registration = ticket
        ? registrations.find((entry) => entry.id === ticket.registrationId)
        : undefined;
      const staff = users.find((entry) => entry.id === row.staffUserId);
      return {
        ...row,
        staff: staff ? { id: staff.id, name: staff.name } : null,
        ticket: ticket
          ? {
              ...ticket,
              user: holder ? { id: holder.id, name: holder.name, email: holder.email } : null,
              registration: registration ? { tier: registration.tier } : null,
            }
          : null,
      };
    }) as never;
  });

  vi.spyOn(prisma.checkIn, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (checkIns.some((row) => row.ticketId === data.ticketId)) throw uniqueError();
    const row: MemoryCheckIn = {
      id: data.id ?? crypto.randomUUID(),
      ticketId: data.ticketId,
      eventId: data.eventId,
      staffUserId: data.staffUserId,
      checkedInAt: data.checkedInAt ? new Date(data.checkedInAt) : new Date(),
    };
    checkIns.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.paymentWebhookDelivery, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (webhookDeliveries.some((row) => row.id === data.id)) throw uniqueError();
    const row: MemoryWebhookDelivery = {
      id: data.id,
      eventType: data.eventType,
      razorpayOrderId: data.razorpayOrderId ?? null,
      outcome: data.outcome,
      createdAt: new Date(),
    };
    webhookDeliveries.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.paymentWebhookDelivery, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = webhookDeliveries.find((row) => row.id === where.id);
    if (!match) throw new Error('Webhook delivery not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return { ...match } as never;
  });

  const withVariants = (product: MemoryProduct) => ({
    ...product,
    variants: variants
      .filter((variant) => variant.productId === product.id)
      .map((variant) => ({ ...variant })),
  });

  vi.spyOn(prisma.product, 'count').mockImplementation(async (args) => {
    return products.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.product, 'findMany').mockImplementation(async (args) => {
    let matches = products.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const orderBy = args?.orderBy as Record<string, 'asc' | 'desc'> | undefined;
    const sortKey = orderBy ? Object.keys(orderBy)[0] : undefined;
    if (sortKey) {
      const direction = orderBy?.[sortKey];
      matches = [...matches].sort((left, right) => {
        const a = (left as unknown as Record<string, unknown>)[sortKey];
        const b = (right as unknown as Record<string, unknown>)[sortKey];
        const cmp = a instanceof Date && b instanceof Date ? a.getTime() - b.getTime() : String(a).localeCompare(String(b));
        return direction === 'desc' ? -cmp : cmp;
      });
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withVariants) as never;
  });

  vi.spyOn(prisma.product, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = products.find((row) => row.id === where.id);
    return (match ? withVariants(match) : null) as never;
  });

  vi.spyOn(prisma.product, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (data.sku && products.some((row) => row.sku === data.sku)) throw uniqueError();
    const now = new Date();
    const product: MemoryProduct = {
      id: data.id ?? crypto.randomUUID(),
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      category: data.category,
      sku: data.sku ?? null,
      memberPrice: data.memberPrice,
      standardPrice: data.standardPrice,
      status: data.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    products.push(product);
    const createdVariants = (data.variants?.create ?? []) as Array<{ size: string; stock: number }>;
    for (const variant of createdVariants) {
      variants.push({
        id: crypto.randomUUID(),
        productId: product.id,
        size: variant.size,
        stock: variant.stock,
      });
    }
    return withVariants(product) as never;
  });

  vi.spyOn(prisma.product, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = products.find((row) => row.id === where.id);
    if (!match) throw new Error('Product not found');
    const data = args.data as any;
    if (data.sku && products.some((row) => row.sku === data.sku && row.id !== match.id)) {
      throw uniqueError();
    }
    applyPatch(match as unknown as Record<string, any>, data);
    return withVariants(match) as never;
  });

  vi.spyOn(prisma.productVariant, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = variants.find((row) => {
      if (where.id) return row.id === where.id;
      if (where.productId_size) {
        return row.productId === where.productId_size.productId && row.size === where.productId_size.size;
      }
      return false;
    });
    return (match ? { ...match } : null) as never;
  });

  vi.spyOn(prisma.productVariant, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = variants.find((row) => row.id === where.id);
    if (!match) throw new Error('Variant not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return { ...match } as never;
  });

  vi.spyOn(prisma.productVariant, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    let count = 0;
    for (const row of variants) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, args.data as any);
      count += 1;
    }
    return { count } as never;
  });

  const withItems = (order: MemoryMerchOrder) => ({
    ...order,
    items: merchItems.filter((item) => item.orderId === order.id).map((item) => ({ ...item })),
    user: (() => {
      const user = users.find((entry) => entry.id === order.userId);
      return user ? { id: user.id, name: user.name, email: user.email } : null;
    })(),
  });

  vi.spyOn(prisma.merchOrder, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = merchOrders.find((row) => {
      if (where.id) return row.id === where.id;
      if (where.idempotencyKey) return row.idempotencyKey === where.idempotencyKey;
      if (where.orderNumber) return row.orderNumber === where.orderNumber;
      return false;
    });
    return (match ? withItems(match) : null) as never;
  });

  vi.spyOn(prisma.merchOrder, 'findMany').mockImplementation(async (args) => {
    let matches = merchOrders.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.createdAt === 'desc') {
      matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withItems) as never;
  });

  vi.spyOn(prisma.merchOrder, 'count').mockImplementation(async (args) => {
    return merchOrders.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.merchOrder, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (data.idempotencyKey && merchOrders.some((row) => row.idempotencyKey === data.idempotencyKey)) {
      throw uniqueError();
    }
    if (merchOrders.some((row) => row.orderNumber === data.orderNumber)) throw uniqueError();
    const now = new Date();
    const order: MemoryMerchOrder = {
      id: crypto.randomUUID(),
      orderNumber: data.orderNumber,
      userId: data.userId,
      status: data.status ?? 'PLACED',
      totalAmount: data.totalAmount,
      currency: data.currency ?? 'INR',
      idempotencyKey: data.idempotencyKey ?? null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
    merchOrders.push(order);
    const creates = (data.items?.create ?? []) as any[];
    for (const item of creates) {
      merchItems.push({
        id: crypto.randomUUID(),
        orderId: order.id,
        productId: item.product.connect.id,
        size: item.size,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      });
    }
    return withItems(order) as never;
  });

  vi.spyOn(prisma.merchOrder, 'updateMany').mockImplementation(async (args) => {
    let count = 0;
    for (const row of merchOrders) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, args.where as any)) continue;
      applyPatch(row as unknown as Record<string, any>, args.data as any);
      count += 1;
    }
    return { count } as never;
  });

  vi.spyOn(prisma.merchOrder, 'aggregate').mockImplementation(async (args) => {
    const matches = merchOrders.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const sum = matches.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);
    const count = matches.length;
    return {
      _sum: { totalAmount: sum },
      _count: { id: count },
    } as never;
  });

  const withAuthor = (row: MemoryAnnouncement) => {
    const author = users.find((entry) => entry.id === row.authorId);
    return {
      ...row,
      author: author
        ? { id: author.id, name: author.name, role: author.role }
        : { id: row.authorId, name: 'Unknown', role: 'MEMBER' },
    };
  };

  vi.spyOn(prisma.announcement, 'count').mockImplementation(async (args) => {
    return announcements.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.announcement, 'findMany').mockImplementation(async (args) => {
    let matches = announcements.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const orderBy = args?.orderBy as any;
    if (orderBy?.publishedAt === 'desc') {
      matches = [...matches].sort(
        (a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
      );
    } else if (orderBy?.updatedAt === 'desc') {
      matches = [...matches].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withAuthor) as never;
  });

  vi.spyOn(prisma.announcement, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = announcements.find((row) => row.id === where.id);
    return (match ? withAuthor(match) : null) as never;
  });

  vi.spyOn(prisma.announcement, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const row: MemoryAnnouncement = {
      id: crypto.randomUUID(),
      title: data.title,
      body: data.body,
      authorId: data.authorId,
      status: data.status ?? 'DRAFT',
      audience: data.audience ?? 'ALL_MEMBERS',
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    announcements.push(row);
    return withAuthor(row) as never;
  });

  vi.spyOn(prisma.announcement, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = announcements.find((row) => row.id === where.id);
    if (!match) throw new Error('Announcement not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    if ((args.data as any).publishedAt) match.publishedAt = new Date((args.data as any).publishedAt);
    return withAuthor(match) as never;
  });

  // VOLUNTEER OPPORTUNITY
  const withOppRelations = (opp: MemoryVolunteerOpportunity) => {
    const organizer = users.find((u) => u.id === opp.organizerId);
    const event = opp.eventId ? events.find((e) => e.id === opp.eventId) : null;
    return {
      ...opp,
      organizer: organizer
        ? { id: organizer.id, name: organizer.name, email: organizer.email, role: organizer.role }
        : { id: opp.organizerId, name: 'Organizer', email: 'org@campus.edu', role: 'ADMIN' },
      event: event
        ? { id: event.id, title: event.title, startsAt: event.startsAt, venue: event.venue }
        : null,
    };
  };

  vi.spyOn(prisma.volunteerOpportunity, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const row: MemoryVolunteerOpportunity = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      location: data.location,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
      capacity: data.capacity,
      registeredCount: data.registeredCount ?? 0,
      status: data.status ?? 'DRAFT',
      category: data.category ?? null,
      eligibility: data.eligibility ?? null,
      eventId: data.eventId ?? null,
      organizerId: data.organizerId,
      createdAt: now,
      updatedAt: now,
    };
    volunteerOpportunities.push(row);
    return withOppRelations(row) as never;
  });

  vi.spyOn(prisma.volunteerOpportunity, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = volunteerOpportunities.find((r) => r.id === where.id);
    return (match ? withOppRelations(match) : null) as never;
  });

  vi.spyOn(prisma.volunteerOpportunity, 'findMany').mockImplementation(async (args) => {
    const matches = volunteerOpportunities.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withOppRelations) as never;
  });

  vi.spyOn(prisma.volunteerOpportunity, 'count').mockImplementation(async (args) => {
    return volunteerOpportunities.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.volunteerOpportunity, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = volunteerOpportunities.find((r) => r.id === where.id);
    if (!match) throw new Error('Volunteer opportunity not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return withOppRelations(match) as never;
  });

  vi.spyOn(prisma.volunteerOpportunity, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    let count = 0;
    for (const row of volunteerOpportunities) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, args.data as any);
      count += 1;
    }
    return { count } as never;
  });

  // VOLUNTEER REGISTRATION
  const withSignupRelations = (signup: MemoryVolunteerRegistration) => {
    const user = users.find((u) => u.id === signup.userId);
    const attendedBy = signup.attendedById ? users.find((u) => u.id === signup.attendedById) : null;
    const opp = volunteerOpportunities.find((o) => o.id === signup.opportunityId);
    return {
      ...signup,
      user: user
        ? { id: user.id, name: user.name, email: user.email, role: user.role }
        : { id: signup.userId, name: 'User', email: 'user@campus.edu', role: 'MEMBER' },
      attendedBy: attendedBy ? { id: attendedBy.id, name: attendedBy.name } : null,
      opportunity: opp
        ? {
            id: opp.id,
            title: opp.title,
            description: opp.description,
            location: opp.location,
            startsAt: opp.startsAt,
            endsAt: opp.endsAt,
            status: opp.status,
            category: opp.category,
            capacity: opp.capacity,
            registeredCount: opp.registeredCount,
          }
        : null,
    };
  };

  vi.spyOn(prisma.volunteerRegistration, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const row: MemoryVolunteerRegistration = {
      id: crypto.randomUUID(),
      opportunityId: data.opportunityId,
      userId: data.userId,
      status: data.status ?? 'REGISTERED',
      notes: data.notes ?? null,
      attendanceNotes: null,
      attendedAt: null,
      attendedById: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
    volunteerRegistrations.push(row);
    return withSignupRelations(row) as never;
  });

  vi.spyOn(prisma.volunteerRegistration, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = volunteerRegistrations.find((r) => {
      if (where.id) return r.id === where.id;
      if (where.opportunityId_userId) {
        return (
          r.opportunityId === where.opportunityId_userId.opportunityId &&
          r.userId === where.opportunityId_userId.userId
        );
      }
      return false;
    });
    return (match ? withSignupRelations(match) : null) as never;
  });

  vi.spyOn(prisma.volunteerRegistration, 'findMany').mockImplementation(async (args) => {
    const matches = volunteerRegistrations.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withSignupRelations) as never;
  });

  vi.spyOn(prisma.volunteerRegistration, 'count').mockImplementation(async (args) => {
    return volunteerRegistrations.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.volunteerRegistration, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = volunteerRegistrations.find((r) => r.id === where.id);
    if (!match) throw new Error('Registration not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return withSignupRelations(match) as never;
  });

  // FUNDRAISER
  const withFundraiserRelations = (f: MemoryFundraiser) => {
    const creator = users.find((u) => u.id === f.creatorId);
    return {
      ...f,
      creator: creator
        ? { id: creator.id, name: creator.name, email: creator.email }
        : { id: f.creatorId, name: 'Creator', email: 'creator@campus.edu' },
    };
  };

  vi.spyOn(prisma.fundraiser, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const row: MemoryFundraiser = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      purpose: data.purpose ?? null,
      goalAmount: data.goalAmount,
      currency: data.currency ?? 'INR',
      status: data.status ?? 'DRAFT',
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      beneficiary: data.beneficiary ?? null,
      creatorId: data.creatorId,
      createdAt: now,
      updatedAt: now,
    };
    fundraisers.push(row);
    return withFundraiserRelations(row) as never;
  });

  vi.spyOn(prisma.fundraiser, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = fundraisers.find((r) => r.id === where.id);
    return (match ? withFundraiserRelations(match) : null) as never;
  });

  vi.spyOn(prisma.fundraiser, 'findMany').mockImplementation(async (args) => {
    const matches = fundraisers.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withFundraiserRelations) as never;
  });

  vi.spyOn(prisma.fundraiser, 'count').mockImplementation(async (args) => {
    return fundraisers.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.fundraiser, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = fundraisers.find((r) => r.id === where.id);
    if (!match) throw new Error('Fundraiser not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return withFundraiserRelations(match) as never;
  });

  // FUNDRAISER CONTRIBUTION
  const withContribRelations = (c: MemoryFundraiserContribution) => {
    const donor = c.donorId ? users.find((u) => u.id === c.donorId) : null;
    const fundraiser = fundraisers.find((f) => f.id === c.fundraiserId);
    return {
      ...c,
      donor: donor ? { id: donor.id, name: donor.name, email: donor.email } : null,
      fundraiser: fundraiser
        ? {
            id: fundraiser.id,
            title: fundraiser.title,
            goalAmount: fundraiser.goalAmount,
            currency: fundraiser.currency,
            status: fundraiser.status,
          }
        : null,
    };
  };

  vi.spyOn(prisma.fundraiserContribution, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const row: MemoryFundraiserContribution = {
      id: crypto.randomUUID(),
      fundraiserId: data.fundraiserId,
      donorId: data.donorId ?? null,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      amount: data.amount,
      currency: data.currency ?? 'INR',
      paymentMethod: data.paymentMethod ?? 'ONLINE',
      status: data.status ?? 'PENDING',
      razorpayOrderId: data.razorpayOrderId ?? null,
      razorpayPaymentId: data.razorpayPaymentId ?? null,
      failureReason: null,
      verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : null,
      idempotencyKey: data.idempotencyKey ?? null,
      createdAt: now,
      updatedAt: now,
    };
    fundraiserContributions.push(row);
    return withContribRelations(row) as never;
  });

  vi.spyOn(prisma.fundraiserContribution, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = fundraiserContributions.find((r) => {
      if (where.id) return r.id === where.id;
      if (where.razorpayOrderId) return r.razorpayOrderId === where.razorpayOrderId;
      if (where.idempotencyKey) return r.idempotencyKey === where.idempotencyKey;
      return false;
    });
    return (match ? withContribRelations(match) : null) as never;
  });

  vi.spyOn(prisma.fundraiserContribution, 'findMany').mockImplementation(async (args) => {
    const matches = fundraiserContributions.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withContribRelations) as never;
  });

  vi.spyOn(prisma.fundraiserContribution, 'count').mockImplementation(async (args) => {
    return fundraiserContributions.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.fundraiserContribution, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = fundraiserContributions.find((r) => r.id === where.id);
    if (!match) throw new Error('Contribution not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    if ((args.data as any).verifiedAt) match.verifiedAt = new Date((args.data as any).verifiedAt);
    return withContribRelations(match) as never;
  });

  vi.spyOn(prisma.fundraiserContribution, 'aggregate').mockImplementation(async (args) => {
    const matches = fundraiserContributions.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const sum = matches.reduce((acc, curr) => acc + curr.amount, 0);
    const count = matches.length;
    const avg = count > 0 ? sum / count : 0;
    return {
      _sum: { amount: sum },
      _count: { id: count },
      _avg: { amount: avg },
    } as never;
  });

  vi.spyOn(prisma.fundraiserContribution, 'groupBy').mockImplementation(async (args) => {
    const matches = fundraiserContributions.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const groups = new Map<string, { sum: number; count: number }>();
    for (const m of matches) {
      const key = m.fundraiserId;
      const g = groups.get(key) ?? { sum: 0, count: 0 };
      g.sum += m.amount;
      g.count += 1;
      groups.set(key, g);
    }
    const result = Array.from(groups.entries()).map(([fundraiserId, val]) => ({
      fundraiserId,
      _sum: { amount: val.sum },
      _count: { id: val.count },
    }));
    return result as never;
  });

  // EXPENSE
  const withExpenseRelations = (exp: MemoryExpense) => {
    const submitter = users.find((u) => u.id === exp.submitterId);
    const reviewer = exp.reviewerId ? users.find((u) => u.id === exp.reviewerId) : null;
    const event = exp.eventId ? events.find((e) => e.id === exp.eventId) : null;
    const fundraiser = exp.fundraiserId ? fundraisers.find((f) => f.id === exp.fundraiserId) : null;
    const reimb = reimbursements.find((r) => r.expenseId === exp.id);
    return {
      ...exp,
      submitter: submitter
        ? { id: submitter.id, name: submitter.name, email: submitter.email, role: submitter.role }
        : { id: exp.submitterId, name: 'Submitter', email: 'sub@campus.edu', role: 'MEMBER' },
      reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, email: reviewer.email } : null,
      event: event ? { id: event.id, title: event.title } : null,
      fundraiser: fundraiser ? { id: fundraiser.id, title: fundraiser.title } : null,
      reimbursement: reimb ? { ...reimb } : null,
    };
  };

  vi.spyOn(prisma.expense, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const row: MemoryExpense = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      amount: data.amount,
      currency: data.currency ?? 'INR',
      category: data.category ?? 'OTHER',
      expenseDate: new Date(data.expenseDate),
      receiptUrl: data.receiptUrl ?? null,
      status: data.status ?? 'PENDING',
      submitterId: data.submitterId,
      reviewerId: null,
      reviewedAt: null,
      rejectionReason: null,
      eventId: data.eventId ?? null,
      fundraiserId: data.fundraiserId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    expenses.push(row);
    return withExpenseRelations(row) as never;
  });

  vi.spyOn(prisma.expense, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = expenses.find((r) => r.id === where.id);
    return (match ? withExpenseRelations(match) : null) as never;
  });

  vi.spyOn(prisma.expense, 'findMany').mockImplementation(async (args) => {
    const matches = expenses.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withExpenseRelations) as never;
  });

  vi.spyOn(prisma.expense, 'count').mockImplementation(async (args) => {
    return expenses.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.expense, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = expenses.find((r) => r.id === where.id);
    if (!match) throw new Error('Expense not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    if ((args.data as any).reviewedAt) match.reviewedAt = new Date((args.data as any).reviewedAt);
    return withExpenseRelations(match) as never;
  });

  vi.spyOn(prisma.expense, 'delete').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const idx = expenses.findIndex((r) => r.id === where.id);
    if (idx !== -1) expenses.splice(idx, 1);
    return { id: where.id } as never;
  });

  vi.spyOn(prisma.expense, 'aggregate').mockImplementation(async (args) => {
    const matches = expenses.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const sum = matches.reduce((acc, curr) => acc + curr.amount, 0);
    const count = matches.length;
    return {
      _sum: { amount: sum },
      _count: { id: count },
    } as never;
  });

  vi.spyOn(prisma.expense, 'groupBy').mockImplementation(async (args) => {
    const matches = expenses.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const groups = new Map<string, { sum: number; count: number }>();
    for (const m of matches) {
      const key = m.category;
      const g = groups.get(key) ?? { sum: 0, count: 0 };
      g.sum += m.amount;
      g.count += 1;
      groups.set(key, g);
    }
    const result = Array.from(groups.entries()).map(([category, val]) => ({
      category,
      _sum: { amount: val.sum },
      _count: { id: val.count },
    }));
    return result as never;
  });

  // REIMBURSEMENT
  const withReimbRelations = (reimb: MemoryReimbursement) => {
    const claimant = users.find((u) => u.id === reimb.claimantId);
    const reviewer = reimb.reviewerId ? users.find((u) => u.id === reimb.reviewerId) : null;
    const settledBy = reimb.settledById ? users.find((u) => u.id === reimb.settledById) : null;
    const exp = expenses.find((e) => e.id === reimb.expenseId);
    return {
      ...reimb,
      claimant: claimant
        ? { id: claimant.id, name: claimant.name, email: claimant.email, role: claimant.role }
        : { id: reimb.claimantId, name: 'Claimant', email: 'claim@campus.edu', role: 'MEMBER' },
      reviewer: reviewer ? { id: reviewer.id, name: reviewer.name } : null,
      settledBy: settledBy ? { id: settledBy.id, name: settledBy.name } : null,
      expense: exp
        ? {
            id: exp.id,
            title: exp.title,
            description: exp.description,
            amount: exp.amount,
            category: exp.category,
            expenseDate: exp.expenseDate,
            receiptUrl: exp.receiptUrl,
          }
        : null,
    };
  };

  vi.spyOn(prisma.reimbursement, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const row: MemoryReimbursement = {
      id: crypto.randomUUID(),
      expenseId: data.expenseId,
      claimantId: data.claimantId,
      amount: data.amount,
      currency: data.currency ?? 'INR',
      status: data.status ?? 'PENDING',
      reviewerId: null,
      reviewedAt: null,
      rejectionReason: null,
      settledById: null,
      settledAt: null,
      settlementReference: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    };
    reimbursements.push(row);
    return withReimbRelations(row) as never;
  });

  vi.spyOn(prisma.reimbursement, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = reimbursements.find((r) => {
      if (where.id) return r.id === where.id;
      if (where.expenseId) return r.expenseId === where.expenseId;
      return false;
    });
    return (match ? withReimbRelations(match) : null) as never;
  });

  vi.spyOn(prisma.reimbursement, 'findMany').mockImplementation(async (args) => {
    const matches = reimbursements.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map(withReimbRelations) as never;
  });

  vi.spyOn(prisma.reimbursement, 'count').mockImplementation(async (args) => {
    return reimbursements.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.reimbursement, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = reimbursements.find((r) => r.id === where.id);
    if (!match) throw new Error('Reimbursement not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    if ((args.data as any).settledAt) match.settledAt = new Date((args.data as any).settledAt);
    if ((args.data as any).reviewedAt) match.reviewedAt = new Date((args.data as any).reviewedAt);
    return withReimbRelations(match) as never;
  });

  vi.spyOn(prisma.reimbursement, 'aggregate').mockImplementation(async (args) => {
    const matches = reimbursements.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    const sum = matches.reduce((acc, curr) => acc + curr.amount, 0);
    const count = matches.length;
    return {
      _sum: { amount: sum },
      _count: { id: count },
    } as never;
  });
}

export function memoryVariants(): MemoryVariant[] {
  return variants.map((row) => ({ ...row }));
}

export function memoryMerchOrders(): MemoryMerchOrder[] {
  return merchOrders.map((row) => ({ ...row }));
}

export function memoryAnnouncements(): MemoryAnnouncement[] {
  return announcements.map((row) => ({ ...row }));
}

export function memoryOpportunities(): MemoryVolunteerOpportunity[] {
  return volunteerOpportunities.map((row) => ({ ...row }));
}

export function memorySignups(): MemoryVolunteerRegistration[] {
  return volunteerRegistrations.map((row) => ({ ...row }));
}

export function memoryFundraisers(): MemoryFundraiser[] {
  return fundraisers.map((row) => ({ ...row }));
}

export function memoryContributions(): MemoryFundraiserContribution[] {
  return fundraiserContributions.map((row) => ({ ...row }));
}

export function memoryExpenses(): MemoryExpense[] {
  return expenses.map((row) => ({ ...row }));
}

export function memoryReimbursements(): MemoryReimbursement[] {
  return reimbursements.map((row) => ({ ...row }));
}

