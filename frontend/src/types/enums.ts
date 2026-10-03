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

export type ReimbursementStatus = 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED' | 'PENDING' | 'SETTLED'

export type OrderStatus = 'PLACED' | 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED'

export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED'

export type VolunteerSignupStatus = 'REGISTERED' | 'ATTENDED' | 'NO_SHOW' | 'EXCUSED' | 'CANCELLED'

export type FundraiserStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED'

export type ContributionStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type ExpenseCategory =
  | 'TRAVEL'
  | 'SUPPLIES'
  | 'FOOD_BEVERAGE'
  | 'EQUIPMENT'
  | 'VENUE'
  | 'MARKETING'
  | 'OTHER'
