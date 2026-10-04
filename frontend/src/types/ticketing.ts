import { EventItem, EventRegistration } from './events';
import { User } from './auth';

export type TicketStatus = 'ISSUED' | 'USED' | 'CANCELLED';
export type PaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Ticket {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: TicketStatus;
  issuedAt: string;
  checkedInAt?: string | null;
  checkedInById?: string | null;
  qrToken?: string;
  qrDataUrl?: string;
  tier?: string;
  event?: EventItem;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface CheckInResult {
  id: string;
  eventId: string;
  status: TicketStatus;
  checkedInAt?: string | null;
  tier: string;
  holderName: string;
  holderEmail: string;
  checkedInById?: string | null;
}

export type TicketValidationStatus =
  | 'VALID'
  | 'INVALID'
  | 'WRONG_EVENT'
  | 'CANCELLED'
  | 'UNPAID'
  | 'USED';

export interface TicketValidationResponse {
  result: TicketValidationStatus;
  ticket: CheckInResult | null;
}

export interface CheckInAttendeeResponse {
  result: 'CHECKED_IN';
  ticket: CheckInResult;
}

export interface AttendanceRecord {
  id: string;
  ticketId: string;
  eventId: string;
  staffUserId: string;
  checkedInAt: string;
  ticket?: Ticket;
  staff?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Payment {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  signatureVerifiedAt?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  keyId?: string;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerifyResponse {
  payment: Payment;
  registration: EventRegistration;
  tickets: Ticket[];
  ticket: Ticket | null;
}
