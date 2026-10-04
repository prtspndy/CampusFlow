import { User } from './auth';
import type { Ticket } from './ticketing';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type TicketTier = 'MEMBER' | 'STANDARD';
export type RegistrationStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  category?: string | null;
  imageUrl?: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  memberPrice: number;
  standardPrice: number;
  totalCapacity?: number | null;
  registeredCount: number;
  isFeatured: boolean;
  organizerId: string;
  organizer?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  venue: string;
  category?: string;
  imageUrl?: string;
  startsAt: string;
  endsAt: string;
  memberPrice?: number;
  standardPrice?: number;
  totalCapacity?: number | null;
  isFeatured?: boolean;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

export interface ListEventsQuery {
  status?: EventStatus;
  category?: string;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  tier: TicketTier;
  quantity: number;
  amountPaise: number;
  currency: string;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  event?: EventItem;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  tickets?: Ticket[];
  ticket?: Ticket;
}

export interface RegisterEventResult {
  registration: EventRegistration;
  requiresPayment: boolean;
  ticket?: Ticket | null;
  tickets?: Ticket[];
  paymentOrder?: {
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
    keyId?: string;
  };
}
