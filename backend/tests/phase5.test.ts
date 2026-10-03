import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import {
  insertUser,
  installPrismaMemory,
  resetMemoryDb,
} from './helpers/memory-prisma.js';
import type { UserRole } from '../src/types/auth.js';

const password = 'Password123!';

function signPayment(orderId: string, paymentId: string): string {
  return crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

describe('Phase 5 — Volunteers, Fundraisers, Expenses, Reimbursements & Finance Reports', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryDb();
    installPrismaMemory();
  });

  async function createAccount(email: string, role: UserRole) {
    const passwordHash = await bcrypt.hash(password, 4);
    const user = insertUser({
      email,
      name: `User ${email.split('@')[0]}`,
      passwordHash,
      role,
      status: 'active',
      tokenVersion: 0,
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password,
    });

    return {
      user,
      token: loginRes.body.data.token as string,
    };
  }

  // =========================================================================
  // MODULE A: VOLUNTEER MANAGEMENT
  // =========================================================================
  describe('Module A — Volunteers', () => {
    it('allows EVENT_MANAGER and ADMIN to create opportunities, rejects MEMBER with 403', async () => {
      const admin = await createAccount('admin@campus.edu', 'ADMIN');
      const em = await createAccount('em@campus.edu', 'EVENT_MANAGER');
      const member = await createAccount('member@campus.edu', 'MEMBER');

      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const futureEndDate = new Date(Date.now() + 90000000).toISOString();

      // Authorized creation by ADMIN
      const createResAdmin = await request(app)
        .post('/api/volunteers/opportunities')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Spring Gala Stage Setup',
          description: 'Help assemble stage, lighting, and seating for the gala.',
          location: 'Grand Hall Entrance',
          startsAt: futureDate,
          endsAt: futureEndDate,
          capacity: 5,
        });

      expect(createResAdmin.status).toBe(201);
      expect(createResAdmin.body.data.title).toBe('Spring Gala Stage Setup');
      expect(createResAdmin.body.data.capacity).toBe(5);
      expect(createResAdmin.body.data.spotsRemaining).toBe(5);

      // Authorized creation by EVENT_MANAGER
      const createResEm = await request(app)
        .post('/api/volunteers/opportunities')
        .set('Authorization', `Bearer ${em.token}`)
        .send({
          title: 'Hackathon Registration Desk',
          description: 'Check in students and distribute lanyards.',
          location: 'Lab 3 Foyer',
          startsAt: futureDate,
          endsAt: futureEndDate,
          capacity: 2,
        });

      expect(createResEm.status).toBe(201);

      // Unauthorized creation by MEMBER
      const memberRes = await request(app)
        .post('/api/volunteers/opportunities')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Unauthorized Opp',
          description: 'Members cannot create opportunities.',
          location: 'Anywhere',
          startsAt: futureDate,
          endsAt: futureEndDate,
          capacity: 10,
        });

      expect(memberRes.status).toBe(403);
      expect(memberRes.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects invalid inputs such as non-positive capacity or end time before start time', async () => {
      const admin = await createAccount('admin2@campus.edu', 'ADMIN');
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const pastDate = new Date(Date.now() + 10000).toISOString();

      // End time before start time
      const timeRes = await request(app)
        .post('/api/volunteers/opportunities')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Time Travel Cleanup',
          description: 'Valid description of adequate length.',
          location: 'Physics Lawn',
          startsAt: futureDate,
          endsAt: pastDate,
          capacity: 5,
        });

      expect(timeRes.status).toBe(422);

      // Non-positive capacity
      const capRes = await request(app)
        .post('/api/volunteers/opportunities')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Zero Capacity Opp',
          description: 'Valid description of adequate length.',
          location: 'Physics Lawn',
          startsAt: pastDate,
          endsAt: futureDate,
          capacity: 0,
        });

      expect(capRes.status).toBe(422);
    });

    it('allows a member to sign up for published opportunities, rejects duplicate and overcapacity signups', async () => {
      const admin = await createAccount('admin3@campus.edu', 'ADMIN');
      const member1 = await createAccount('student1@campus.edu', 'MEMBER');
      const member2 = await createAccount('student2@campus.edu', 'MEMBER');

      const startsAt = new Date(Date.now() + 86400000).toISOString();
      const endsAt = new Date(Date.now() + 90000000).toISOString();

      // Create opportunity with capacity 1 and PUBLISHED
      const oppRes = await request(app)
        .post('/api/volunteers/opportunities')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Solo Sound Engineer Assistant',
          description: 'Assisting audio lead with mixer boards.',
          location: 'Auditorium Booth',
          startsAt,
          endsAt,
          capacity: 1,
          status: 'PUBLISHED',
        });
      const oppId = oppRes.body.data.id;

      // Member 1 signs up successfully
      const signup1 = await request(app)
        .post(`/api/volunteers/opportunities/${oppId}/signups`)
        .set('Authorization', `Bearer ${member1.token}`)
        .send({ notes: 'Experience with Yamaha mixers' });

      expect(signup1.status).toBe(201);
      expect(signup1.body.data.status).toBe('REGISTERED');

      // Member 1 tries to sign up again (Duplicate prevention)
      const duplicateRes = await request(app)
        .post(`/api/volunteers/opportunities/${oppId}/signups`)
        .set('Authorization', `Bearer ${member1.token}`)
        .send({});

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('ALREADY_SIGNED_UP');

      // Member 2 tries to sign up (Capacity full)
      const fullRes = await request(app)
        .post(`/api/volunteers/opportunities/${oppId}/signups`)
        .set('Authorization', `Bearer ${member2.token}`)
        .send({});

      expect(fullRes.status).toBe(409);
      expect(fullRes.body.error.code).toBe('CAPACITY_REACHED');

      // Member 1 retrieves own signups
      const mySignups = await request(app)
        .get('/api/volunteers/signups/me')
        .set('Authorization', `Bearer ${member1.token}`);

      expect(mySignups.status).toBe(200);
      expect(mySignups.body.data.length).toBe(1);
      expect(mySignups.body.data[0].opportunity.title).toBe('Solo Sound Engineer Assistant');

      // Member 1 cancels signup
      const cancelRes = await request(app)
        .post(`/api/volunteers/signups/${signup1.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${member1.token}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Now Member 2 can claim the freed slot
      const signup2 = await request(app)
        .post(`/api/volunteers/opportunities/${oppId}/signups`)
        .set('Authorization', `Bearer ${member2.token}`)
        .send({});

      expect(signup2.status).toBe(201);
      expect(signup2.body.data.status).toBe('REGISTERED');
    });

    it('allows coordinator to view participants and mark attendance, blocks ordinary members', async () => {
      const admin = await createAccount('admin4@campus.edu', 'ADMIN');
      const member = await createAccount('member_attend@campus.edu', 'MEMBER');

      const startsAt = new Date(Date.now() + 86400000).toISOString();
      const endsAt = new Date(Date.now() + 90000000).toISOString();

      const oppRes = await request(app)
        .post('/api/volunteers/opportunities')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Campus Clean-up Drive',
          description: 'Collecting litter and planting trees.',
          location: 'North Quad',
          startsAt,
          endsAt,
          capacity: 10,
          status: 'PUBLISHED',
        });
      const oppId = oppRes.body.data.id;

      const signupRes = await request(app)
        .post(`/api/volunteers/opportunities/${oppId}/signups`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({});
      const signupId = signupRes.body.data.id;

      // Member cannot access participant roster
      const memberRoster = await request(app)
        .get(`/api/volunteers/opportunities/${oppId}/participants`)
        .set('Authorization', `Bearer ${member.token}`);
      expect(memberRoster.status).toBe(403);

      // Admin accesses participant roster
      const adminRoster = await request(app)
        .get(`/api/volunteers/opportunities/${oppId}/participants`)
        .set('Authorization', `Bearer ${admin.token}`);
      expect(adminRoster.status).toBe(200);
      expect(adminRoster.body.data.participants.length).toBe(1);
      expect(adminRoster.body.data.participants[0].user.email).toBe('member_attend@campus.edu');

      // Member cannot update attendance
      const memberMark = await request(app)
        .patch(`/api/volunteers/signups/${signupId}/attendance`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ status: 'ATTENDED' });
      expect(memberMark.status).toBe(403);

      // Admin marks attendance as ATTENDED
      const adminMark = await request(app)
        .patch(`/api/volunteers/signups/${signupId}/attendance`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ status: 'ATTENDED', attendanceNotes: 'Completed full 4 hours shift' });
      expect(adminMark.status).toBe(200);
      expect(adminMark.body.data.status).toBe('ATTENDED');
      expect(adminMark.body.data.attendanceNotes).toBe('Completed full 4 hours shift');
    });
  });

  // =========================================================================
  // MODULE B: FUNDRAISER MANAGEMENT
  // =========================================================================
  describe('Module B — Fundraisers & Contributions', () => {
    it('creates and manages fundraisers, rejecting unauthorized mutations', async () => {
      const treasurer = await createAccount('treasurer1@campus.edu', 'TREASURER');
      const member = await createAccount('donor_member@campus.edu', 'MEMBER');

      // Treasurer creates fundraiser
      const createRes = await request(app)
        .post('/api/fundraisers')
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({
          title: 'Campus Solar Pavilion Project',
          description: 'Constructing solar powered charging canopies across student lawns.',
          purpose: 'Campus Sustainability',
          goalAmount: 75000,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.goalAmount).toBe(75000);
      expect(createRes.body.data.status).toBe('DRAFT');
      const fundId = createRes.body.data.id;

      // Member cannot publish or modify
      const memberMod = await request(app)
        .patch(`/api/fundraisers/${fundId}`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ goalAmount: 1000 });
      expect(memberMod.status).toBe(403);

      // Treasurer publishes
      const pubRes = await request(app)
        .post(`/api/fundraisers/${fundId}/publish`)
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('ACTIVE');

      // Read published details
      const detailRes = await request(app).get(`/api/fundraisers/${fundId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.title).toBe('Campus Solar Pavilion Project');
      expect(detailRes.body.data.collectedAmount).toBe(0);
      expect(detailRes.body.data.donorCount).toBe(0);
    });

    it('records contributions, verifies payments, and strictly counts verified amounts in totals', async () => {
      const admin = await createAccount('admin_fund@campus.edu', 'ADMIN');
      const createRes = await request(app)
        .post('/api/fundraisers')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Library 24/7 Snack Bar Fund',
          description: 'Providing free coffee and healthy fruits during finals week.',
          goalAmount: 20000,
          status: 'ACTIVE',
        });
      const fundId = createRes.body.data.id;

      // Make contribution 1 (Cash / Direct: Verified immediately)
      const cashRes = await request(app)
        .post(`/api/fundraisers/${fundId}/contributions`)
        .send({
          amount: 5000,
          donorName: 'Alumni Donor',
          donorEmail: 'alumni@skyline.org',
          paymentMethod: 'CASH',
        });

      expect(cashRes.status).toBe(201);
      expect(cashRes.body.data.contribution.status).toBe('VERIFIED');

      // Make contribution 2 (Online: starts PENDING)
      const onlineRes = await request(app)
        .post(`/api/fundraisers/${fundId}/contributions`)
        .send({
          amount: 3000,
          donorName: 'Student Supporter',
          donorEmail: 'student@skyline.edu',
          paymentMethod: 'ONLINE',
          idempotencyKey: 'idemp-fund-001',
        });

      expect(onlineRes.status).toBe(201);
      expect(onlineRes.body.data.contribution.status).toBe('PENDING');
      const orderId = onlineRes.body.data.contribution.razorpayOrderId;

      // Total collected before verification: strictly 5000 (excluding 3000 pending)
      const preSummary = await request(app).get(`/api/fundraisers/${fundId}`);
      expect(preSummary.body.data.collectedAmount).toBe(5000);
      expect(preSummary.body.data.donorCount).toBe(1);

      // Verify payment of online contribution
      const payId = 'pay_test_001';
      const sig = signPayment(orderId, payId);
      const verifyRes = await request(app)
        .post('/api/fundraisers/verify')
        .send({
          razorpayOrderId: orderId,
          razorpayPaymentId: payId,
          razorpaySignature: sig,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.contribution.status).toBe('VERIFIED');

      // Total collected after verification: 5000 + 3000 = 8000
      const postSummary = await request(app).get(`/api/fundraisers/${fundId}`);
      expect(postSummary.body.data.collectedAmount).toBe(8000);
      expect(postSummary.body.data.donorCount).toBe(2);
      expect(postSummary.body.data.percentRaised).toBe(40); // 8000 / 20000 = 40%

      // Idempotency check: repeated request with same idempotencyKey returns existing contribution
      const idempRes = await request(app)
        .post(`/api/fundraisers/${fundId}/contributions`)
        .send({
          amount: 3000,
          donorName: 'Student Supporter',
          donorEmail: 'student@skyline.edu',
          paymentMethod: 'ONLINE',
          idempotencyKey: 'idemp-fund-001',
        });

      expect(idempRes.body.data.alreadyExisted).toBe(true);
      expect(idempRes.body.data.contribution.id).toBe(onlineRes.body.data.contribution.id);
    });

    it('processes fundraiser payment webhooks idempotently', async () => {
      const admin = await createAccount('admin_fund_wh@campus.edu', 'ADMIN');
      const startsAt = new Date().toISOString();
      const deadline = new Date(Date.now() + 864000000).toISOString();

      const fRes = await request(app)
        .post('/api/fundraisers')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Robotics Kit Drive',
          description: 'Components for robotics project',
          goalAmount: 50000,
          startsAt,
          deadline,
          status: 'ACTIVE',
        });
      const fundId = fRes.body.data.id;

      // Online contribution
      const contribRes = await request(app)
        .post(`/api/fundraisers/${fundId}/contributions`)
        .send({
          amount: 5000,
          donorName: 'Tech Alum',
          donorEmail: 'alum@tech.org',
          paymentMethod: 'ONLINE',
          idempotencyKey: 'idemp-wh-fund-01',
        });
      expect(contribRes.status).toBe(201);
      const orderId = contribRes.body.data.razorpayOrderId;
      expect(orderId).not.toBeNull();

      // Dispatch webhook
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_fund_wh_123',
              order_id: orderId,
              amount: 500000,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });

      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(webhookPayload)
        .digest('hex');

      const whRes = await request(app)
        .post('/api/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .set('x-razorpay-event-id', 'evt_fund_wh_001')
        .send(webhookPayload);

      expect(whRes.status).toBe(200);

      // Verify contribution status is updated
      const listRes = await request(app)
        .get(`/api/fundraisers/${fundId}/contributions`)
        .set('Authorization', `Bearer ${admin.token}`);
      const updatedContrib = listRes.body.data.contributions.find(
        (c: { id: string }) => c.id === contribRes.body.data.contribution.id,
      );
      expect(updatedContrib.status).toBe('VERIFIED');

      // Replay identical webhook -> handled idempotently
      const replayRes = await request(app)
        .post('/api/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .set('x-razorpay-event-id', 'evt_fund_wh_001')
        .send(webhookPayload);

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.duplicate).toBe(true);
    });
  });

  // =========================================================================
  // MODULE C: EXPENSES & REIMBURSEMENTS
  // =========================================================================
  describe('Module C — Expenses & Reimbursements', () => {
    it('submits expenses, enforces review authorization, and auto-queues reimbursement on approval', async () => {
      const member = await createAccount('expense_submitter@campus.edu', 'MEMBER');
      const treasurer = await createAccount('treasurer_review@campus.edu', 'TREASURER');

      // Member submits valid expense
      const submitRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Paint & Brushes for Club Fair Banner',
          description: 'Purchased acrylic paint sets and rollers from ArtSupplies Inc.',
          amount: 1450,
          category: 'SUPPLIES',
          expenseDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt-1450.pdf',
        });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.data.status).toBe('PENDING');
      expect(submitRes.body.data.amount).toBe(1450);
      const expenseId = submitRes.body.data.id;

      // Member can read their own expense
      const ownRes = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${member.token}`);
      expect(ownRes.status).toBe(200);

      // Another member cannot read it
      const stranger = await createAccount('stranger@campus.edu', 'MEMBER');
      const strangerRes = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${stranger.token}`);
      expect(strangerRes.status).toBe(403);

      // Stranger cannot approve it
      const unauthApprove = await request(app)
        .post(`/api/expenses/${expenseId}/approve`)
        .set('Authorization', `Bearer ${stranger.token}`);
      expect(unauthApprove.status).toBe(403);

      // Treasurer approves expense
      const approveRes = await request(app)
        .post(`/api/expenses/${expenseId}/approve`)
        .set('Authorization', `Bearer ${treasurer.token}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');
      expect(approveRes.body.data.reimbursement).toBeDefined();
      expect(approveRes.body.data.reimbursement.status).toBe('PENDING');
      const reimbursementId = approveRes.body.data.reimbursement.id;

      // Cannot re-approve an already approved expense
      const reApprove = await request(app)
        .post(`/api/expenses/${expenseId}/approve`)
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(reApprove.status).toBe(400);

      // Approval is NOT settlement: verify reimbursement is still PENDING
      const reimbDetail = await request(app)
        .get(`/api/reimbursements/${reimbursementId}`)
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(reimbDetail.body.data.status).toBe('PENDING');
      expect(reimbDetail.body.data.settledAt).toBeNull();

      // Authorized finance user marks reimbursement as settled
      const settleRes = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/settle`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({
          settlementReference: 'IMPS-2026-991204',
          notes: 'Bank transfer completed to student account',
        });

      expect(settleRes.status).toBe(200);
      expect(settleRes.body.data.status).toBe('SETTLED');
      expect(settleRes.body.data.settlementReference).toBe('IMPS-2026-991204');
      expect(settleRes.body.data.settledAt).not.toBeNull();
    });

    it('rejects an expense with a mandatory rejection reason', async () => {
      const member = await createAccount('submitter_reject@campus.edu', 'MEMBER');
      const admin = await createAccount('admin_reject@campus.edu', 'ADMIN');

      const submitRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Personal Lunch',
          description: 'Dining out at cafe',
          amount: 500,
          category: 'REFRESHMENTS',
          expenseDate: new Date().toISOString(),
        });
      const expenseId = submitRes.body.data.id;

      // Missing reason is rejected
      const noReason = await request(app)
        .post(`/api/expenses/${expenseId}/reject`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({});
      expect(noReason.status).toBe(422);

      // Valid rejection with reason
      const rejectRes = await request(app)
        .post(`/api/expenses/${expenseId}/reject`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ reason: 'Personal meals outside event scope cannot be reimbursed per club bylaws' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('REJECTED');
      expect(rejectRes.body.data.rejectionReason).toContain('Personal meals outside event scope');
    });

    it('prevents self-approval of expenses and self-settlement of reimbursements', async () => {
      const admin = await createAccount('admin_self_approve@campus.edu', 'ADMIN');
      const treasurer = await createAccount('treasurer_self_approve@campus.edu', 'TREASURER');

      // Admin submits an expense
      const submitRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Admin Conference Fee',
          description: 'Registration fee for student leadership conference',
          amount: 2500,
          category: 'OTHER',
          expenseDate: new Date().toISOString(),
        });
      expect(submitRes.status).toBe(201);
      const expenseId = submitRes.body.data.id;

      // Admin attempts to approve their own expense -> FORBIDDEN (403)
      const selfApprove = await request(app)
        .post(`/api/expenses/${expenseId}/approve`)
        .set('Authorization', `Bearer ${admin.token}`);
      expect(selfApprove.status).toBe(403);
      expect(selfApprove.body.error.code).toBe('SELF_APPROVAL_FORBIDDEN');

      // Treasurer approves Admin's expense -> OK (200)
      const approveRes = await request(app)
        .post(`/api/expenses/${expenseId}/approve`)
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(approveRes.status).toBe(200);
      const reimbursementId = approveRes.body.data.reimbursement.id;

      // Admin attempts to settle their own reimbursement -> FORBIDDEN (403)
      const selfSettle = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/settle`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ settlementReference: 'TXN-SELF-123' });
      expect(selfSettle.status).toBe(403);
      expect(selfSettle.body.error.code).toBe('SELF_SETTLEMENT_FORBIDDEN');

      // Treasurer settles Admin's reimbursement -> OK (200)
      const settleRes = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/settle`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({ settlementReference: 'TXN-TREAS-456' });
      expect(settleRes.status).toBe(200);
      expect(settleRes.body.data.status).toBe('SETTLED');
    });
  });

  // =========================================================================
  // MODULE D: FINANCE DASHBOARD & REPORTS
  // =========================================================================
  describe('Module D — Finance Dashboard, Ledger & Reports', () => {
    it('calculates financial summaries from persisted database records accurately', async () => {
      const treasurer = await createAccount('treasurer_summary@campus.edu', 'TREASURER');
      const member = await createAccount('member_summary@campus.edu', 'MEMBER');

      // 1. Submit and approve an expense (3000), then settle it
      const exp1 = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer={member.token}`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Venue Projector Rental',
          description: 'Deposit for AV equipment',
          amount: 3000,
          category: 'EQUIPMENT',
          expenseDate: new Date().toISOString(),
        });

      const app1 = await request(app)
        .post(`/api/expenses/${exp1.body.data.id}/approve`)
        .set('Authorization', `Bearer ${treasurer.token}`);

      await request(app)
        .post(`/api/reimbursements/${app1.body.data.reimbursement.id}/settle`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({ settlementReference: 'TXN-001' });

      // 2. Submit another expense (1500), approved but NOT settled (outstanding obligation)
      const exp2 = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Flyer Printing',
          description: 'Brochures for orientation',
          amount: 1500,
          category: 'MARKETING',
          expenseDate: new Date().toISOString(),
        });

      await request(app)
        .post(`/api/expenses/${exp2.body.data.id}/approve`)
        .set('Authorization', `Bearer ${treasurer.token}`);

      // 3. Submit a third expense (800), rejected
      const exp3 = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Uber Ride',
          description: 'Commute taxi',
          amount: 800,
          category: 'TRAVEL',
          expenseDate: new Date().toISOString(),
        });

      await request(app)
        .post(`/api/expenses/${exp3.body.data.id}/reject`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({ reason: 'Receipt missing itemization' });

      // 4. Create fundraiser and record verified donation (10000)
      const fund = await request(app)
        .post('/api/fundraisers')
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({
          title: 'Equipment Fundraiser',
          description: 'Raising money for studio mics',
          goalAmount: 25000,
          status: 'ACTIVE',
        });

      await request(app)
        .post(`/api/fundraisers/${fund.body.data.id}/contributions`)
        .send({
          amount: 10000,
          donorName: 'Patron',
          donorEmail: 'patron@example.com',
          paymentMethod: 'CASH',
        });

      // Fetch financial summary
      const summaryRes = await request(app)
        .get('/api/finance/summary')
        .set('Authorization', `Bearer ${treasurer.token}`);

      expect(summaryRes.status).toBe(200);
      const data = summaryRes.body.data;

      // Assertions
      expect(data.totalApprovedExpenses).toBe(4500); // 3000 + 1500
      expect(data.totalPendingExpenses).toBe(0);
      expect(data.totalRejectedExpenses).toBe(800);
      expect(data.totalSettledReimbursements).toBe(3000);
      expect(data.outstandingReimbursementObligations).toBe(1500);
      expect(data.totalVerifiedFundraiserContributions).toBe(10000);
      expect(data.totalInflows).toBe(10000);
      expect(data.totalOutflows).toBe(3000);
      expect(data.netTreasuryBalance).toBe(7000); // 10000 - 3000

      // Ledger transactions check
      const ledgerRes = await request(app)
        .get('/api/finance/ledger')
        .set('Authorization', `Bearer ${treasurer.token}`);

      expect(ledgerRes.status).toBe(200);
      expect(ledgerRes.body.data.transactions.length).toBeGreaterThanOrEqual(2);

      // CSV export check
      const exportRes = await request(app)
        .get('/api/finance/export')
        .set('Authorization', `Bearer ${treasurer.token}`);

      expect(exportRes.status).toBe(200);
      expect(exportRes.headers['content-type']).toContain('text/csv');
      expect(exportRes.text).toContain('Date,Description,Category,Amount,Status,Source');
      expect(exportRes.text).toContain('Equipment Fundraiser');
    });

    it('blocks ordinary members from finance dashboard and export endpoints', async () => {
      const member = await createAccount('member_blocked@campus.edu', 'MEMBER');

      const sumRes = await request(app)
        .get('/api/finance/summary')
        .set('Authorization', `Bearer ${member.token}`);
      expect(sumRes.status).toBe(403);

      const ledgerRes = await request(app)
        .get('/api/finance/ledger')
        .set('Authorization', `Bearer ${member.token}`);
      expect(ledgerRes.status).toBe(403);

      const expRes = await request(app)
        .get('/api/finance/export')
        .set('Authorization', `Bearer ${member.token}`);
      expect(expRes.status).toBe(403);
    });

    it('sanitizes CSV exports against spreadsheet formula injection (OWASP)', async () => {
      const treasurer = await createAccount('treasurer_csv@campus.edu', 'TREASURER');
      const member = await createAccount('member_csv@campus.edu', 'MEMBER');

      // Submit an expense containing formula injection characters
      const submitRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: '=HYPERLINK("http://attacker.com")',
          description: '@SUM(1+1)*cmd|calc',
          amount: 650,
          category: 'SUPPLIES',
          expenseDate: new Date().toISOString(),
        });
      expect(submitRes.status).toBe(201);

      // Approve expense
      const approveRes = await request(app)
        .post(`/api/expenses/${submitRes.body.data.id}/approve`)
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(approveRes.status).toBe(200);

      // Settle reimbursement
      await request(app)
        .post(`/api/reimbursements/${approveRes.body.data.reimbursement.id}/settle`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({ settlementReference: 'TXN-SAFE-01' });

      // Export CSV
      const exportRes = await request(app)
        .get('/api/finance/export')
        .set('Authorization', `Bearer ${treasurer.token}`);

      expect(exportRes.status).toBe(200);
      // Verify formula injection prefixing with single quote
      expect(exportRes.text).toContain("'=HYPERLINK");
      expect(exportRes.text).not.toContain('"=HYPERLINK');
    });
  });
});
