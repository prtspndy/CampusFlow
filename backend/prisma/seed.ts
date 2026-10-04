import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  AnnouncementAudience,
  AnnouncementStatus,
  ContributionStatus,
  EventStatus,
  ExpenseCategory,
  ExpenseStatus,
  FundraiserStatus,
  MembershipStatus,
  MerchOrderStatus,
  OpportunityStatus,
  PaymentStatus,
  PrismaClient,
  ProductStatus,
  RegistrationStatus,
  ReimbursementStatus,
  TicketStatus,
  TicketTier,
  UserRole,
  VolunteerSignupStatus,
  type User,
} from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password1';

const ANNUAL_PERKS = [
  'Free admission to general events',
  'Discounted Spring Gala ticket',
  '15% merchandise discount in the club shop',
  'Official scannable digital Member Pass',
];

const SEMESTER_PERKS = [
  'Discounted event tickets',
  '10% merchandise discount',
  'Official scannable digital Member Pass',
];

type SeedUser = { email: string; name: string; role: UserRole };

const ACCOUNTS: SeedUser[] = [
  { email: 'admin@campus.edu', name: 'Meera Shah', role: UserRole.ADMIN },
  { email: 'eventmanager@campus.edu', name: 'Arjun Mehta', role: UserRole.EVENT_MANAGER },
  { email: 'treasurer@campus.edu', name: 'Priya Nair', role: UserRole.TREASURER },
  { email: 'member@campus.edu', name: 'Ananya Iyer', role: UserRole.MEMBER },
  { email: 'rahul.desai@campus.edu', name: 'Rahul Desai', role: UserRole.MEMBER },
  { email: 'sneha.kapoor@campus.edu', name: 'Sneha Kapoor', role: UserRole.MEMBER },
  { email: 'kabir.malhotra@campus.edu', name: 'Kabir Malhotra', role: UserRole.MEMBER },
  { email: 'isha.banerjee@campus.edu', name: 'Isha Banerjee', role: UserRole.MEMBER },
];

function at(iso: string): Date {
  return new Date(iso);
}

function ticketKey(): Buffer {
  const secret = process.env.TICKET_ENCRYPTION_KEY || 'dev-only-ticket-encryption-key-change';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptToken(token: string): { hash: string; encrypted: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ticketKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    hash: crypto.createHash('sha256').update(token).digest('hex'),
    encrypted: Buffer.concat([iv, tag, ciphertext]).toString('base64url'),
  };
}

async function upsertUser(account: SeedUser, passwordHash: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  if (!existing) {
    return prisma.user.create({
      data: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role,
        status: 'active',
      },
    });
  }
  return prisma.user.update({
    where: { email: account.email },
    data: { name: account.name, role: account.role, status: 'active' },
  });
}

async function ensureMembership(input: {
  userId: string;
  memberCode: string;
  planName: string;
  status: MembershipStatus;
  validUntil: Date;
  perks: string[];
  adminNotes?: string;
}) {
  const existing = await prisma.membership.findUnique({ where: { memberCode: input.memberCode } });
  if (existing) return existing;
  return prisma.membership.create({
    data: {
      userId: input.userId,
      memberCode: input.memberCode,
      planName: input.planName,
      status: input.status,
      startDate: at('2026-08-01T04:30:00.000Z'),
      validUntil: input.validUntil,
      renewalCount: 0,
      perks: input.perks,
      adminNotes: input.adminNotes ?? null,
    },
  });
}

async function ensureEvent(input: {
  title: string;
  description: string;
  venue: string;
  category: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  memberPrice: number;
  standardPrice: number;
  totalCapacity: number;
  isFeatured?: boolean;
  organizerId: string;
}) {
  const existing = await prisma.event.findFirst({ where: { title: input.title } });
  if (existing) return existing;
  return prisma.event.create({
    data: {
      title: input.title,
      description: input.description,
      venue: input.venue,
      category: input.category,
      startsAt: at(input.startsAt),
      endsAt: at(input.endsAt),
      status: input.status,
      memberPrice: input.memberPrice,
      standardPrice: input.standardPrice,
      totalCapacity: input.totalCapacity,
      registeredCount: 0,
      isFeatured: input.isFeatured ?? false,
      organizerId: input.organizerId,
    },
  });
}

async function ensureRegistration(input: {
  eventId: string;
  userId: string;
  tier: TicketTier;
  quantity: number;
  amountPaise: number;
  status: RegistrationStatus;
  checkedIn?: boolean;
  staffUserId?: string;
}) {
  const existing = await prisma.eventRegistration.findFirst({
    where: { eventId: input.eventId, userId: input.userId, status: input.status },
  });
  if (existing) return existing;

  const registration = await prisma.eventRegistration.create({
    data: {
      eventId: input.eventId,
      userId: input.userId,
      status: input.status,
      tier: input.tier,
      quantity: input.quantity,
      amountPaise: input.amountPaise,
      currency: 'INR',
    },
  });

  if (input.amountPaise > 0 && input.status === RegistrationStatus.CONFIRMED) {
    await prisma.payment.create({
      data: {
        registrationId: registration.id,
        eventId: input.eventId,
        userId: input.userId,
        amountPaise: input.amountPaise,
        currency: 'INR',
        status: PaymentStatus.PAID,
        signatureVerifiedAt: at('2026-09-20T08:15:00.000Z'),
      },
    });
  }

  for (let index = 0; index < input.quantity; index += 1) {
    const token = `cf_${crypto.randomBytes(32).toString('base64url')}`;
    const sealed = encryptToken(token);
    const used = Boolean(input.checkedIn) && index === 0;
    const ticket = await prisma.ticket.create({
      data: {
        registrationId: registration.id,
        eventId: input.eventId,
        userId: input.userId,
        status: used ? TicketStatus.USED : TicketStatus.ISSUED,
        verificationTokenHash: sealed.hash,
        encryptedVerificationToken: sealed.encrypted,
        issuedAt: at('2026-09-20T08:20:00.000Z'),
        checkedInAt: used ? at('2026-09-06T13:10:00.000Z') : null,
        checkedInById: used ? input.staffUserId ?? null : null,
      },
    });
    if (used && input.staffUserId) {
      await prisma.checkIn.create({
        data: {
          ticketId: ticket.id,
          eventId: input.eventId,
          staffUserId: input.staffUserId,
          checkedInAt: at('2026-09-06T13:10:00.000Z'),
        },
      });
    }
  }

  return registration;
}

async function refreshEventCount(eventId: string) {
  const confirmed = await prisma.eventRegistration.findMany({
    where: { eventId, status: RegistrationStatus.CONFIRMED },
    select: { quantity: true },
  });
  const registeredCount = confirmed.reduce((sum, row) => sum + row.quantity, 0);
  await prisma.event.update({ where: { id: eventId }, data: { registeredCount } });
}

async function main() {
  console.log('Seeding Horizon Student Council demo term...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = new Map<string, User>();

  for (const account of ACCOUNTS) {
    const user = await upsertUser(account, passwordHash);
    users.set(account.email, user);
    console.log(`Account ready: ${account.email} (${account.role})`);
  }

  const admin = users.get('admin@campus.edu')!;
  const manager = users.get('eventmanager@campus.edu')!;
  const treasurer = users.get('treasurer@campus.edu')!;
  const ananya = users.get('member@campus.edu')!;
  const rahul = users.get('rahul.desai@campus.edu')!;
  const sneha = users.get('sneha.kapoor@campus.edu')!;
  const kabir = users.get('kabir.malhotra@campus.edu')!;
  const isha = users.get('isha.banerjee@campus.edu')!;

  await ensureMembership({
    userId: ananya.id,
    memberCode: 'CF-2026-4101',
    planName: 'annual',
    status: MembershipStatus.ACTIVE,
    validUntil: at('2027-08-01T04:30:00.000Z'),
    perks: ANNUAL_PERKS,
    adminNotes: 'Paid ₹25 at the membership desk on 12 Aug 2026.',
  });
  await ensureMembership({
    userId: rahul.id,
    memberCode: 'CF-2026-4102',
    planName: 'semester',
    status: MembershipStatus.ACTIVE,
    validUntil: at('2026-12-15T04:30:00.000Z'),
    perks: SEMESTER_PERKS,
    adminNotes: 'Semester dues collected during orientation week.',
  });
  await ensureMembership({
    userId: sneha.id,
    memberCode: 'CF-2026-4103',
    planName: 'annual',
    status: MembershipStatus.ACTIVE,
    validUntil: at('2027-08-01T04:30:00.000Z'),
    perks: ANNUAL_PERKS,
  });
  await ensureMembership({
    userId: kabir.id,
    memberCode: 'CF-2026-4104',
    planName: 'annual',
    status: MembershipStatus.PENDING,
    validUntil: at('2027-08-01T04:30:00.000Z'),
    perks: ANNUAL_PERKS,
    adminNotes: 'Application received at the hostel desk. Cash still to be confirmed.',
  });
  await ensureMembership({
    userId: isha.id,
    memberCode: 'CF-2026-4105',
    planName: 'semester',
    status: MembershipStatus.EXPIRED,
    validUntil: at('2026-05-31T04:30:00.000Z'),
    perks: SEMESTER_PERKS,
    adminNotes: 'Spring semester pass expired. Renewal not yet requested.',
  });

  const gala = await ensureEvent({
    title: 'Horizon Annual Gala 2026',
    description:
      'The council\'s flagship evening: alumni awards, a student jazz set, and dinner on the east lawn. Doors open at 6:30 pm. Member tickets are ₹250; guests pay ₹400. Seating is capped at 180.',
    venue: 'East Lawn and Senate Hall',
    category: 'Gala',
    startsAt: '2026-11-14T13:00:00.000Z',
    endsAt: '2026-11-14T17:30:00.000Z',
    status: EventStatus.PUBLISHED,
    memberPrice: 250,
    standardPrice: 400,
    totalCapacity: 180,
    isFeatured: true,
    organizerId: manager.id,
  });

  const buildNight = await ensureEvent({
    title: 'Build Night: Campus App Sprint',
    description:
      'A Saturday lab session for first-years and council volunteers. Teams ship a small campus tool, with mentors from the computer science club. Entry is free for active members.',
    venue: 'Innovation Lab 3, Academic Block C',
    category: 'Tech',
    startsAt: '2026-10-18T04:30:00.000Z',
    endsAt: '2026-10-18T10:30:00.000Z',
    status: EventStatus.PUBLISHED,
    memberPrice: 0,
    standardPrice: 50,
    totalCapacity: 40,
    organizerId: manager.id,
  });

  const cultural = await ensureEvent({
    title: 'Monsoon Cultural Evening',
    description:
      'Music, classical dance, and food stalls organised with the cultural committee. Open to members and guests. Bring a college ID at the gate.',
    venue: 'Open Air Theatre',
    category: 'Cultural',
    startsAt: '2026-10-25T13:30:00.000Z',
    endsAt: '2026-10-25T16:30:00.000Z',
    status: EventStatus.PUBLISHED,
    memberPrice: 100,
    standardPrice: 150,
    totalCapacity: 300,
    organizerId: manager.id,
  });

  const orientation = await ensureEvent({
    title: 'Orientation Week Mixer',
    description:
      'The welcome mixer for the 2026 council term. New members met committee leads, collected passes, and signed up for the first volunteer shifts.',
    venue: 'Student Centre Atrium',
    category: 'Social',
    startsAt: '2026-09-06T11:00:00.000Z',
    endsAt: '2026-09-06T14:00:00.000Z',
    status: EventStatus.COMPLETED,
    memberPrice: 0,
    standardPrice: 0,
    totalCapacity: 120,
    organizerId: manager.id,
  });

  await ensureEvent({
    title: 'Winter Volunteer Briefing',
    description:
      'Draft agenda for the December community drive. Shift leads still need to confirm the school visit and the donation drop-off window.',
    venue: 'Council Room 2',
    category: 'Community',
    startsAt: '2026-12-02T09:00:00.000Z',
    endsAt: '2026-12-02T10:30:00.000Z',
    status: EventStatus.DRAFT,
    memberPrice: 0,
    standardPrice: 0,
    totalCapacity: 25,
    organizerId: manager.id,
  });

  await ensureRegistration({
    eventId: gala.id,
    userId: ananya.id,
    tier: TicketTier.MEMBER,
    quantity: 2,
    amountPaise: 50000,
    status: RegistrationStatus.CONFIRMED,
  });
  await ensureRegistration({
    eventId: gala.id,
    userId: rahul.id,
    tier: TicketTier.MEMBER,
    quantity: 1,
    amountPaise: 25000,
    status: RegistrationStatus.CONFIRMED,
  });
  await ensureRegistration({
    eventId: buildNight.id,
    userId: ananya.id,
    tier: TicketTier.MEMBER,
    quantity: 1,
    amountPaise: 0,
    status: RegistrationStatus.CONFIRMED,
  });
  await ensureRegistration({
    eventId: cultural.id,
    userId: sneha.id,
    tier: TicketTier.MEMBER,
    quantity: 1,
    amountPaise: 10000,
    status: RegistrationStatus.PENDING_PAYMENT,
  });
  await ensureRegistration({
    eventId: orientation.id,
    userId: ananya.id,
    tier: TicketTier.MEMBER,
    quantity: 1,
    amountPaise: 0,
    status: RegistrationStatus.CONFIRMED,
    checkedIn: true,
    staffUserId: manager.id,
  });
  await ensureRegistration({
    eventId: orientation.id,
    userId: rahul.id,
    tier: TicketTier.MEMBER,
    quantity: 1,
    amountPaise: 0,
    status: RegistrationStatus.CONFIRMED,
    checkedIn: true,
    staffUserId: manager.id,
  });

  for (const eventId of [gala.id, buildNight.id, cultural.id, orientation.id]) {
    await refreshEventCount(eventId);
  }

  const hoodie = await prisma.product.findUnique({ where: { sku: 'HSC-HD-26' } });
  const hoodieProduct =
    hoodie ??
    (await prisma.product.create({
      data: {
        name: 'Horizon Council Hoodie 2026',
        description:
          'Navy fleece hoodie with the council mark embroidered on the chest. Pickup is from the student centre desk after the order is placed.',
        category: 'Apparel',
        sku: 'HSC-HD-26',
        memberPrice: 899,
        standardPrice: 1099,
        status: ProductStatus.ACTIVE,
        variants: {
          create: [
            { size: 'S', stock: 14 },
            { size: 'M', stock: 22 },
            { size: 'L', stock: 18 },
            { size: 'XL', stock: 9 },
          ],
        },
      },
    }));

  const tote = await prisma.product.findUnique({ where: { sku: 'HSC-TOTE-26' } });
  const toteProduct =
    tote ??
    (await prisma.product.create({
      data: {
        name: 'Council Canvas Tote',
        description:
          'Heavy cotton tote for books and event kits. One size. Members pay ₹199 at the desk or through an in-app pickup order.',
        category: 'Accessories',
        sku: 'HSC-TOTE-26',
        memberPrice: 199,
        standardPrice: 249,
        status: ProductStatus.ACTIVE,
        variants: { create: [{ size: 'M', stock: 40 }] },
      },
    }));

  const existingOrder = await prisma.merchOrder.findUnique({ where: { orderNumber: 'HSC-1042' } });
  if (!existingOrder) {
    await prisma.merchOrder.create({
      data: {
        orderNumber: 'HSC-1042',
        userId: ananya.id,
        status: MerchOrderStatus.PLACED,
        totalAmount: 899,
        currency: 'INR',
        idempotencyKey: 'demo-ananya-hoodie-2026',
        items: {
          create: [
            {
              productId: hoodieProduct.id,
              size: 'M',
              productName: hoodieProduct.name,
              unitPrice: 899,
              quantity: 1,
              lineTotal: 899,
            },
          ],
        },
      },
    });
    await prisma.productVariant.updateMany({
      where: { productId: hoodieProduct.id, size: 'M', stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
  }

  const existingToteOrder = await prisma.merchOrder.findUnique({ where: { orderNumber: 'HSC-1048' } });
  if (!existingToteOrder) {
    await prisma.merchOrder.create({
      data: {
        orderNumber: 'HSC-1048',
        userId: rahul.id,
        status: MerchOrderStatus.PLACED,
        totalAmount: 199,
        currency: 'INR',
        idempotencyKey: 'demo-rahul-tote-2026',
        items: {
          create: [
            {
              productId: toteProduct.id,
              size: 'M',
              productName: toteProduct.name,
              unitPrice: 199,
              quantity: 1,
              lineTotal: 199,
            },
          ],
        },
      },
    });
  }

  async function ensureAnnouncement(title: string, body: string, audience: AnnouncementAudience, publish: boolean) {
    const existing = await prisma.announcement.findFirst({ where: { title } });
    if (existing) return existing;
    return prisma.announcement.create({
      data: {
        title,
        body,
        authorId: admin.id,
        audience,
        status: publish ? AnnouncementStatus.PUBLISHED : AnnouncementStatus.DRAFT,
        publishedAt: publish ? at('2026-10-02T06:00:00.000Z') : null,
      },
    });
  }

  await ensureAnnouncement(
    'Gala seating closes on 7 November',
    'Member tickets for Horizon Annual Gala are ₹250 and guest tickets are ₹400. The east lawn holds 180 people. If you are bringing a guest, buy both passes before 7 November so the catering count stays accurate.',
    AnnouncementAudience.ALL_MEMBERS,
    true,
  );
  await ensureAnnouncement(
    'Usher shifts for the gala are open',
    'We still need six ushers for the 6:30 pm door and four people for the alumni reception. Shifts are two hours. Sign up on the volunteer board if you can stay until 9 pm.',
    AnnouncementAudience.VOLUNTEERS,
    true,
  );
  await ensureAnnouncement(
    'Draft: December school visit plan',
    'Internal note for the community committee. The municipal school has asked for a Saturday morning reading circle. Confirm transport before this goes to the full membership.',
    AnnouncementAudience.VOLUNTEERS,
    false,
  );

  async function ensureShift(input: {
    title: string;
    description: string;
    location: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    eventId?: string;
    category: string;
  }) {
    const existing = await prisma.volunteerOpportunity.findFirst({ where: { title: input.title } });
    if (existing) return existing;
    return prisma.volunteerOpportunity.create({
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        startsAt: at(input.startsAt),
        endsAt: at(input.endsAt),
        applicationDeadline: at('2026-11-10T12:00:00.000Z'),
        capacity: input.capacity,
        registeredCount: 0,
        status: OpportunityStatus.PUBLISHED,
        category: input.category,
        eligibility: 'Active members preferred. First-years are welcome.',
        eventId: input.eventId ?? null,
        organizerId: manager.id,
      },
    });
  }

  const usher = await ensureShift({
    title: 'Gala door ushers',
    description: 'Check passes at the east lawn entrance and direct guests to the dinner seating.',
    location: 'East Lawn gate',
    startsAt: '2026-11-14T12:30:00.000Z',
    endsAt: '2026-11-14T15:30:00.000Z',
    capacity: 6,
    eventId: gala.id,
    category: 'Event',
  });
  const desk = await ensureShift({
    title: 'Membership desk, student centre',
    description: 'Help students complete annual and semester passes and hand over pickup slips for hoodie orders.',
    location: 'Student Centre, ground floor',
    startsAt: '2026-10-16T04:30:00.000Z',
    endsAt: '2026-10-16T08:30:00.000Z',
    capacity: 4,
    category: 'Membership',
  });

  async function ensureSignup(opportunityId: string, userId: string, notes: string) {
    const existing = await prisma.volunteerRegistration.findUnique({
      where: { opportunityId_userId: { opportunityId, userId } },
    });
    if (existing) return existing;
    const signup = await prisma.volunteerRegistration.create({
      data: {
        opportunityId,
        userId,
        status: VolunteerSignupStatus.REGISTERED,
        notes,
      },
    });
    await prisma.volunteerOpportunity.update({
      where: { id: opportunityId },
      data: { registeredCount: { increment: 1 } },
    });
    return signup;
  }

  await ensureSignup(usher.id, ananya.id, 'Can stay until the alumni reception ends.');
  await ensureSignup(desk.id, rahul.id, 'Free after the 11 am lecture.');

  const driveTitle = 'Lab gear for the robotics workshop';
  let drive = await prisma.fundraiser.findFirst({ where: { title: driveTitle } });
  if (!drive) {
    drive = await prisma.fundraiser.create({
      data: {
        title: driveTitle,
        description:
          'Raising ₹45,000 for soldering kits, a bench supply, and spare boards so the October build night is not limited to students who already own a kit.',
        purpose: 'Workshop equipment',
        goalAmount: 45000,
        currency: 'INR',
        status: FundraiserStatus.ACTIVE,
        startsAt: at('2026-09-15T04:30:00.000Z'),
        deadline: at('2026-10-31T18:30:00.000Z'),
        beneficiary: 'Horizon robotics workshop',
        creatorId: treasurer.id,
      },
    });
  }

  async function ensureGift(key: string, donorName: string, donorEmail: string, amount: number, donorId?: string) {
    const existing = await prisma.fundraiserContribution.findUnique({ where: { idempotencyKey: key } });
    if (existing) return existing;
    return prisma.fundraiserContribution.create({
      data: {
        fundraiserId: drive.id,
        donorId: donorId ?? null,
        donorName,
        donorEmail,
        amount,
        currency: 'INR',
        paymentMethod: 'CASH',
        status: ContributionStatus.VERIFIED,
        verifiedAt: at('2026-09-28T07:00:00.000Z'),
        idempotencyKey: key,
      },
    });
  }

  await ensureGift('demo-alumni-gift-18000', 'Class of 2018 alumni circle', 'alumni2018@horizon.edu', 18000);
  await ensureGift('demo-ananya-gift-1500', 'Ananya Iyer', ananya.email, 1500, ananya.id);
  await ensureGift('demo-rahul-gift-800', 'Rahul Desai', rahul.email, 800, rahul.id);

  async function ensureExpense(input: {
    title: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    expenseDate: string;
    status: ExpenseStatus;
    submitterId: string;
    rejectionReason?: string;
    settle?: boolean;
    eventId?: string;
    fundraiserId?: string;
  }) {
    const existing = await prisma.expense.findFirst({
      where: { title: input.title, submitterId: input.submitterId },
    });
    if (existing) return existing;
    const expense = await prisma.expense.create({
      data: {
        title: input.title,
        description: input.description,
        amount: input.amount,
        currency: 'INR',
        category: input.category,
        expenseDate: at(input.expenseDate),
        status: input.status,
        submitterId: input.submitterId,
        reviewerId: input.status === ExpenseStatus.PENDING ? null : treasurer.id,
        reviewedAt: input.status === ExpenseStatus.PENDING ? null : at('2026-09-22T09:00:00.000Z'),
        rejectionReason: input.rejectionReason ?? null,
        eventId: input.eventId ?? null,
        fundraiserId: input.fundraiserId ?? null,
      },
    });
    if (input.status === ExpenseStatus.APPROVED) {
      await prisma.reimbursement.create({
        data: {
          expenseId: expense.id,
          claimantId: input.submitterId,
          amount: input.amount,
          currency: 'INR',
          status: input.settle ? ReimbursementStatus.SETTLED : ReimbursementStatus.PENDING,
          reviewerId: treasurer.id,
          reviewedAt: at('2026-09-22T09:00:00.000Z'),
          settledById: input.settle ? treasurer.id : null,
          settledAt: input.settle ? at('2026-09-24T06:40:00.000Z') : null,
          settlementReference: input.settle ? 'UTR-HSC-24096' : null,
          notes: input.settle ? 'Settled to the claimant UPI after the venue invoice was matched.' : null,
        },
      });
    }
    return expense;
  }

  await ensureExpense({
    title: 'Senate Hall booking deposit',
    description: 'Advance paid to the estates office to hold Senate Hall and the east lawn for 14 November.',
    amount: 12000,
    category: ExpenseCategory.VENUE,
    expenseDate: '2026-09-18T06:00:00.000Z',
    status: ExpenseStatus.APPROVED,
    submitterId: manager.id,
    settle: true,
    eventId: gala.id,
  });
  await ensureExpense({
    title: 'Gala invitation print run',
    description: '200 invitation cards and table numbers from the campus print shop.',
    amount: 2400,
    category: ExpenseCategory.MARKETING,
    expenseDate: '2026-10-01T06:00:00.000Z',
    status: ExpenseStatus.APPROVED,
    submitterId: ananya.id,
    eventId: gala.id,
  });
  await ensureExpense({
    title: 'Build night component kit',
    description: 'Breadboards, jumpers, and a spare bench supply for students who do not own a kit.',
    amount: 3600,
    category: ExpenseCategory.EQUIPMENT,
    expenseDate: '2026-10-03T06:00:00.000Z',
    status: ExpenseStatus.PENDING,
    submitterId: rahul.id,
    fundraiserId: drive.id,
  });
  await ensureExpense({
    title: 'Cab from the station after rehearsal',
    description: 'Personal cab fare. Not a council expense.',
    amount: 280,
    category: ExpenseCategory.TRAVEL,
    expenseDate: '2026-09-27T15:00:00.000Z',
    status: ExpenseStatus.REJECTED,
    submitterId: sneha.id,
    rejectionReason: 'Personal travel is not reimbursed. Please use the council shuttle list.',
  });

  console.log('Demo term ready. Sign in with Password1.');
  console.log('  admin@campus.edu          Meera Shah');
  console.log('  eventmanager@campus.edu   Arjun Mehta');
  console.log('  treasurer@campus.edu      Priya Nair');
  console.log('  member@campus.edu         Ananya Iyer');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
