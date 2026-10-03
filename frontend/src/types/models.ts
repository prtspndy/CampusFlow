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
}

export interface User {
  id: string
  name: string
  email: string
  studentId?: string
  avatarUrl?: string
  role: UserRole
  status?: string
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
  eventId?: string
  date: string
  location: string
  spotsNeeded: number
  spotsFilled: number
  contactPerson: string
}

export interface Fundraiser {
  id: string
  title: string
  goalAmount: number
  currentAmount: number
  deadline: string
  description: string
  donorCount: number
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
