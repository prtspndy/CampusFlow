export type MembershipStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'PENDING'

export type TicketStatus = 'VALID' | 'USED' | 'INVALID'

export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED'

export type AudienceType = 'ALL_MEMBERS' | 'VOLUNTEERS' | 'EVENT_ATTENDEES'

export type BroadcastChannel = 'WEBSITE' | 'EMAIL'

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type TransactionCategory =
  | 'DUES'
  | 'TICKETS'
  | 'MERCH'
  | 'FUNDRAISER'
  | 'EXPENSE'

export type ReimbursementStatus = 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED'

export type OrderStatus = 'PLACED' | 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED'
