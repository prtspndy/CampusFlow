import { User } from './auth';

export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';
export type VolunteerSignupStatus = 'REGISTERED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW';

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  applicationDeadline?: string | null;
  capacity: number;
  registeredCount: number;
  status: OpportunityStatus;
  category?: string | null;
  eligibility?: string | null;
  eventId?: string | null;
  organizerId: string;
  organizer?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerRegistration {
  id: string;
  opportunityId: string;
  userId: string;
  status: VolunteerSignupStatus;
  notes?: string | null;
  attendanceNotes?: string | null;
  attendedAt?: string | null;
  attendedById?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity?: VolunteerOpportunity;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface CreateOpportunityInput {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  applicationDeadline?: string;
  category?: string;
  eligibility?: string;
  eventId?: string;
}

export interface UpdateOpportunityInput extends Partial<CreateOpportunityInput> {}

export interface UpdateAttendanceInput {
  status: VolunteerSignupStatus;
  attendanceNotes?: string;
}
