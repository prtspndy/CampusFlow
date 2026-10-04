import { User } from './auth';

export type FundraiserStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
export type ContributionStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';

export interface Fundraiser {
  id: string;
  title: string;
  description: string;
  purpose?: string | null;
  goalAmount: number;
  currency: string;
  status: FundraiserStatus;
  startsAt?: string | null;
  deadline?: string | null;
  beneficiary?: string | null;
  creatorId: string;
  creator?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
  totalRaised?: number;
  collectedAmount?: number;
  percentRaised?: number;
  donorCount?: number;
  verifiedCount?: number;
}

export interface FundraiserContribution {
  id: string;
  fundraiserId: string;
  donorId?: string | null;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: ContributionStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  failureReason?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  fundraiser?: Pick<Fundraiser, 'id' | 'title'>;
}

export interface FundraiserSummary {
  fundraiserId: string;
  title: string;
  goalAmount: number;
  collectedAmount: number;
  currency: string;
  status: FundraiserStatus;
  percentRaised: number;
  donorCount: number;
  verifiedCount: number;
  pendingCount?: number;
  failedCount?: number;
  averageDonation?: number;
  id?: string;
  totalVerifiedAmount?: number;
  percentAchieved?: number;
  contributionCount?: number;
}

export interface CreateContributionResult {
  contribution: FundraiserContribution;
  razorpayOrderId?: string | null;
  keyId?: string;
  alreadyExisted: boolean;
}

export interface VerifyContributionResult {
  contribution: FundraiserContribution;
  verified: boolean;
  alreadyVerified: boolean;
}

export interface CreateFundraiserInput {
  title: string;
  description: string;
  purpose?: string;
  goalAmount: number;
  startsAt?: string;
  deadline?: string;
  beneficiary?: string;
}

export interface UpdateFundraiserInput extends Partial<CreateFundraiserInput> {}

export interface CreateContributionInput {
  donorName: string;
  donorEmail: string;
  amount: number;
  paymentMethod?: string;
  idempotencyKey?: string;
}

export interface VerifyContributionInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  contributionId?: string;
}
