-- Phase 05: volunteers, fundraisers, contributions, expenses, and reimbursements.

CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED');
CREATE TYPE "VolunteerSignupStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "FundraiserStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED');
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ExpenseCategory" AS ENUM ('SUPPLIES', 'TRAVEL', 'VENUE', 'REFRESHMENTS', 'EQUIPMENT', 'MARKETING', 'OTHER');
CREATE TYPE "ReimbursementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SETTLED');

CREATE TABLE "volunteer_opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "applicationDeadline" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT,
    "eligibility" TEXT,
    "eventId" TEXT,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "volunteer_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "volunteer_registrations" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "VolunteerSignupStatus" NOT NULL DEFAULT 'REGISTERED',
    "notes" TEXT,
    "attendanceNotes" TEXT,
    "attendedAt" TIMESTAMP(3),
    "attendedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "volunteer_registrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fundraisers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" TEXT,
    "goalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "FundraiserStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "beneficiary" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fundraisers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fundraiser_contributions" (
    "id" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "donorId" TEXT,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE',
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "failureReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fundraiser_contributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "submitterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "eventId" TEXT,
    "fundraiserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reimbursements" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "settledById" TEXT,
    "settledAt" TIMESTAMP(3),
    "settlementReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reimbursements_pkey" PRIMARY KEY ("id")
);

-- Indexes and Constraints
CREATE INDEX "volunteer_opportunities_status_startsAt_idx" ON "volunteer_opportunities"("status", "startsAt");
CREATE INDEX "volunteer_opportunities_organizerId_idx" ON "volunteer_opportunities"("organizerId");
CREATE INDEX "volunteer_opportunities_eventId_idx" ON "volunteer_opportunities"("eventId");

CREATE UNIQUE INDEX "volunteer_registrations_opportunityId_userId_key" ON "volunteer_registrations"("opportunityId", "userId");
CREATE INDEX "volunteer_registrations_userId_idx" ON "volunteer_registrations"("userId");
CREATE INDEX "volunteer_registrations_opportunityId_status_idx" ON "volunteer_registrations"("opportunityId", "status");

CREATE INDEX "fundraisers_status_idx" ON "fundraisers"("status");
CREATE INDEX "fundraisers_creatorId_idx" ON "fundraisers"("creatorId");

CREATE UNIQUE INDEX "fundraiser_contributions_razorpayOrderId_key" ON "fundraiser_contributions"("razorpayOrderId");
CREATE UNIQUE INDEX "fundraiser_contributions_razorpayPaymentId_key" ON "fundraiser_contributions"("razorpayPaymentId");
CREATE UNIQUE INDEX "fundraiser_contributions_idempotencyKey_key" ON "fundraiser_contributions"("idempotencyKey");
CREATE INDEX "fundraiser_contributions_fundraiserId_status_idx" ON "fundraiser_contributions"("fundraiserId", "status");
CREATE INDEX "fundraiser_contributions_donorId_idx" ON "fundraiser_contributions"("donorId");

CREATE INDEX "expenses_submitterId_idx" ON "expenses"("submitterId");
CREATE INDEX "expenses_status_idx" ON "expenses"("status");
CREATE INDEX "expenses_category_idx" ON "expenses"("category");
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

CREATE UNIQUE INDEX "reimbursements_expenseId_key" ON "reimbursements"("expenseId");
CREATE INDEX "reimbursements_claimantId_idx" ON "reimbursements"("claimantId");
CREATE INDEX "reimbursements_status_idx" ON "reimbursements"("status");

-- Check constraints for positive amounts and capacity
ALTER TABLE "volunteer_opportunities" ADD CONSTRAINT "volunteer_opportunities_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "fundraisers" ADD CONSTRAINT "fundraisers_goalAmount_positive" CHECK ("goalAmount" > 0);
ALTER TABLE "fundraiser_contributions" ADD CONSTRAINT "fundraiser_contributions_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_amount_positive" CHECK ("amount" > 0);

-- Foreign Keys
ALTER TABLE "volunteer_opportunities" ADD CONSTRAINT "volunteer_opportunities_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "volunteer_opportunities" ADD CONSTRAINT "volunteer_opportunities_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "volunteer_registrations" ADD CONSTRAINT "volunteer_registrations_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "volunteer_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_registrations" ADD CONSTRAINT "volunteer_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_registrations" ADD CONSTRAINT "volunteer_registrations_attendedById_fkey" FOREIGN KEY ("attendedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fundraisers" ADD CONSTRAINT "fundraisers_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fundraiser_contributions" ADD CONSTRAINT "fundraiser_contributions_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fundraiser_contributions" ADD CONSTRAINT "fundraiser_contributions_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
