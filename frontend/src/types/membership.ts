import { User } from './auth';

export type MembershipPlan = 'annual' | 'semester' | 'lifetime';
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REJECTED';

export interface Membership {
  id: string;
  userId: string;
  memberCode: string;
  planName: string;
  status: MembershipStatus;
  startDate: string;
  validUntil: string;
  renewalCount: number;
  perks: string[];
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface ApplyMembershipInput {
  planName: MembershipPlan;
  notes?: string;
}

export interface RenewMembershipInput {
  planName?: MembershipPlan;
}

export interface UpdateMembershipStatusInput {
  status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'EXPIRED';
  adminNotes?: string;
}

export interface ListMembershipsQuery {
  status?: MembershipStatus;
  planName?: string;
  search?: string;
  page?: number;
  limit?: number;
}
