import type { UserRole } from '../lib/constants'
import type {
  AudienceType,
  BroadcastChannel,
  EventStatus,
  MembershipStatus,
  OrderStatus,
  ProductSize,
  ReimbursementStatus,
  TaskStatus,
  TicketStatus,
  TransactionCategory,
  OpportunityStatus,
  VolunteerSignupStatus,
  FundraiserStatus,
  ContributionStatus,
  ExpenseStatus,
  ExpenseCategory,
} from './enums'

export type {
  UserRole,
  AudienceType,
  BroadcastChannel,
  EventStatus,
  MembershipStatus,
  OrderStatus,
  ProductSize,
  ReimbursementStatus,
  TaskStatus,
  TicketStatus,
  TransactionCategory,
  OpportunityStatus,
  VolunteerSignupStatus,
  FundraiserStatus,
  ContributionStatus,
  ExpenseStatus,
  ExpenseCategory,
}

export interface User {
  id: string
  name: string
  email: string
  studentId?: string
  avatarUrl?: string
  role: UserRole
  roleDisplayName?: string
  permissions?: string[]
  status?: 'active' | 'disabled'
  createdAt?: string
  updatedAt?: string
  /** Populated once membership plans ship (Phase 02). */
  membership?: Membership
}

export interface Membership {
  id: string
  userId: string
  memberCode: string
  status: MembershipStatus
  validUntil: string
  planName: string
  perks: string[]
}

export interface ClubEvent {
  id: string
  title: string
  description: string
  imageUrl?: string
  venue: string
  startsAt: string
  endsAt: string
  memberPrice: number
  standardPrice: number
  totalCapacity: number
  registeredCount: number
  status: EventStatus
  category?: string
  isFeatured?: boolean
}

export interface Ticket {
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventVenue: string
  holderName: string
  holderEmail: string
  ticketType: 'Member' | 'General' | 'VIP'
  ticketCode: string
  qrPayload: string
  status: TicketStatus
  pricePaid: number
  scannedAt?: string
  scannedBy?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  authorName: string
  authorRole: string
  audience: AudienceType
  channels: BroadcastChannel[]
  sentAt: string
  recipientCount: number
  openedCount: number
}

export interface SizeInventory {
  size: ProductSize
  stock: number
}

export interface Product {
  id: string
  name: string
  description: string
  imageUrl: string
  memberPrice: number
  standardPrice: number
  category: string
  sizes: SizeInventory[]
  isAvailable: boolean
}

export interface OrderItem {
  productId: string
  productName: string
  size: ProductSize
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  createdAt: string
  shippingOrPickup: 'PICKUP' | 'SHIPPING'
}

export interface VolunteerOpportunity {
  id: string
  title: string
  description: string
  location: string
  startsAt: string
  endsAt: string
  applicationDeadline?: string | null
  capacity: number
  registeredCount: number
  status: OpportunityStatus
  category?: string | null
  eligibility?: string | null
  eventId?: string | null
  organizerId: string
  createdAt?: string
  updatedAt?: string
  event?: { id: string; title: string } | null
  organizer?: { id: string; name: string; email: string } | null
  // Legacy backward-compatibility aliases
  date?: string
  spotsNeeded?: number
  spotsFilled?: number
  contactPerson?: string
}

export interface VolunteerRegistration {
  id: string
  opportunityId: string
  userId: string
  status: VolunteerSignupStatus
  notes?: string | null
  attendanceNotes?: string | null
  attendedAt?: string | null
  attendedById?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt?: string
  opportunity?: VolunteerOpportunity
  user?: { id: string; name: string; email: string; role?: string }
}

export interface Fundraiser {
  id: string
  title: string
  description: string
  purpose?: string | null
  goalAmount: number
  collectedAmount?: number
  currency?: string
  status?: FundraiserStatus
  donorCount: number
  percentRaised?: number
  startsAt?: string | null
  endsAt?: string | null
  creatorId?: string
  createdAt?: string
  updatedAt?: string
  creator?: { id: string; name: string; email: string }
  // Legacy aliases
  currentAmount?: number
  deadline?: string
}

export interface FundraiserContribution {
  id: string
  fundraiserId: string
  userId?: string | null
  donorName: string
  donorEmail: string
  amount: number
  currency: string
  status: ContributionStatus
  paymentMethod: string
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
  createdAt: string
  verifiedAt?: string | null
  fundraiser?: { id: string; title: string }
}

export interface Task {
  id: string
  fundraiserId?: string
  title: string
  description?: string
  assigneeName?: string
  assigneeAvatar?: string
  status: TaskStatus
  dueDate: string
  isOverdue?: boolean
}

export interface Expense {
  id: string
  title: string
  description: string
  amount: number
  currency: string
  category: ExpenseCategory
  expenseDate: string
  receiptUrl?: string | null
  status: ExpenseStatus
  submitterId: string
  reviewerId?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  eventId?: string | null
  fundraiserId?: string | null
  createdAt: string
  updatedAt: string
  submitter?: { id: string; name: string; email: string; role?: string }
  reviewer?: { id: string; name: string; email?: string } | null
  event?: { id: string; title: string } | null
  fundraiser?: { id: string; title: string } | null
  reimbursement?: Reimbursement | null
}

export interface Reimbursement {
  id: string
  expenseId: string
  claimantId: string
  amount: number
  currency: string
  status: ReimbursementStatus
  reviewerId?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  settledById?: string | null
  settledAt?: string | null
  settlementReference?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  claimant?: { id: string; name: string; email: string; role?: string }
  reviewer?: { id: string; name: string } | null
  settledBy?: { id: string; name: string } | null
  expense?: Partial<Expense> | null
}

export interface LedgerTransaction {
  id: string
  date: string
  description: string
  category: TransactionCategory
  sourceId?: string
  sourceName?: string
  amount: number // Positive: Money In (+), Negative: Money Out (−)
  status: 'COMPLETED' | 'PENDING'
}

export interface ReimbursementRequest {
  id: string
  applicantName: string
  applicantEmail: string
  amount: number
  description: string
  category: string
  receiptUrl?: string
  status: ReimbursementStatus
  submittedAt: string
  reviewedAt?: string
  reviewerNotes?: string
}

export interface FinanceSummaryData {
  totals: {
    totalInflow: number
    totalOutflow: number
    netBalance: number
    pendingExpensesAmount: number
    pendingReimbursementsAmount: number
  }
  breakdown: {
    tickets: { total: number; count: number }
    merchandise: { total: number; count: number }
    fundraisers: { total: number; count: number }
    approvedExpenses: { total: number; count: number }
    pendingExpenses: { total: number; count: number }
    settledReimbursements: { total: number; count: number }
    pendingReimbursements: { total: number; count: number }
  }
  expensesByCategory: Array<{ category: string; total: number; count: number }>
  fundraisers: Array<{ fundraiserId: string; title: string; total: number; count: number }>
}
