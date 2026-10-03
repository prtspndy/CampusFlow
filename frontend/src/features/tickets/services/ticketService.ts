/**
 * Ticket API service — wraps api.ts for ticket and check-in calls.
 * Mirrors backend ticket.service.ts response shapes.
 */
import { api } from '../../../lib/api'

// ─── Backend shape mirrors ──────────────────────────────────────────────────

export type BackendTicketStatus = 'ISSUED' | 'USED' | 'CANCELLED' | 'EXPIRED'

export interface BackendTicket {
  id: string
  registrationId: string
  eventId: string
  userId: string
  status: BackendTicketStatus
  issuedAt: string
  checkedInAt: string | null
  checkedInById: string | null
}

export interface BackendTicketWithQr extends BackendTicket {
  qrToken: string
  qrDataUrl: string
}

export interface BackendTicketWithEvent extends BackendTicket {
  event?: {
    id: string
    title: string
    venue: string
    startsAt: string
    endsAt: string
  }
  registration?: {
    id: string
    status: string
    amountPaise: number
  }
}

export interface ListTicketsResponse {
  tickets: BackendTicketWithEvent[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ValidateTicketResponse {
  valid: boolean
  ticket?: BackendTicket & {
    holder?: { id: string; name: string; email: string }
    event?: { id: string; title: string; venue: string }
  }
  reason?: string
}

export interface CheckInResponse {
  ticket: BackendTicket
  checkedInAt: string
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const ticketApiService = {
  /** List the authenticated user's own tickets. */
  listOwnTickets: (page = 1, limit = 20) =>
    api.get<ListTicketsResponse>(`/tickets/me?page=${page}&limit=${limit}`),

  /** Get a single ticket (own or staff). */
  getTicket: (ticketId: string) =>
    api.get<BackendTicketWithEvent>(`/tickets/${ticketId}`),

  /** Get a ticket's QR code (data URL + token). */
  getTicketQr: (ticketId: string) =>
    api.get<BackendTicketWithQr>(`/tickets/${ticketId}/qr`),

  /** Validate a ticket QR token for an event (requires tickets.validate). */
  validateTicket: (eventId: string, token: string) =>
    api.post<ValidateTicketResponse>(`/events/${eventId}/tickets/validate`, { token }),

  /** Check in a ticket for an event (requires attendance.manage). */
  checkInTicket: (eventId: string, token: string) =>
    api.post<CheckInResponse>(`/events/${eventId}/check-in`, { token }),

  /** List attendance for an event (requires attendance.read). */
  listAttendance: (eventId: string, page = 1, limit = 50) =>
    api.get<{
      attendance: Array<{
        id: string
        ticket: BackendTicket
        checkedInAt: string
        holder: { id: string; name: string; email: string }
      }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }>(`/events/${eventId}/attendance?page=${page}&limit=${limit}`),
}
