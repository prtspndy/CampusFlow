/**
 * Event API service — wraps api.ts for all event-related backend calls.
 * Mirrors backend event.service.ts response shapes exactly.
 */
import { api } from '../../../lib/api'

// ─── Backend shape mirrors ──────────────────────────────────────────────────

export type BackendEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'

export interface BackendEvent {
  id: string
  title: string
  description: string
  venue: string
  category: string | null
  imageUrl: string | null
  startsAt: string
  endsAt: string
  status: BackendEventStatus
  memberPrice: number
  standardPrice: number
  totalCapacity: number
  registeredCount: number
  isFeatured: boolean
  organizerId: string
  organizer: { id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface ListEventsResponse {
  events: BackendEvent[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ListEventsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: BackendEventStatus
  from?: string
  to?: string
}

// ─── Registration shapes ────────────────────────────────────────────────────

export type RegistrationStatus = 'PENDING' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export interface BackendRegistration {
  id: string
  eventId: string
  userId: string
  status: RegistrationStatus
  amountPaise: number
  createdAt: string
  updatedAt: string
  event?: BackendEvent
}

export interface RegisterForEventResponse {
  registration: BackendRegistration
  ticket?: {
    id: string
    registrationId: string
    eventId: string
    userId: string
    status: string
    issuedAt: string
    checkedInAt: string | null
    checkedInById: string | null
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const eventApiService = {
  /** List published events (public, optional auth for draft access). */
  listEvents: (params: ListEventsParams = {}) => {
    const search = new URLSearchParams()
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    if (params.search) search.set('search', params.search)
    if (params.category) search.set('category', params.category)
    if (params.status) search.set('status', params.status)
    if (params.from) search.set('from', params.from)
    if (params.to) search.set('to', params.to)
    const qs = search.toString()
    return api.get<ListEventsResponse>(`/events${qs ? `?${qs}` : ''}`, { auth: false })
  },

  /** Get a single event by ID. */
  getEvent: (eventId: string) =>
    api.get<BackendEvent>(`/events/${eventId}`, { auth: false }),

  /** Register the authenticated user for an event. */
  registerForEvent: (eventId: string) =>
    api.post<RegisterForEventResponse>(`/events/${eventId}/registrations`),

  /** Get the authenticated user's own registrations. */
  listOwnRegistrations: (page = 1, limit = 20) =>
    api.get<{
      registrations: BackendRegistration[]
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }>(`/registrations/me?page=${page}&limit=${limit}`),

  /** Cancel a registration by ID. */
  cancelRegistration: (registrationId: string) =>
    api.post<{ registration: BackendRegistration }>(`/registrations/${registrationId}/cancel`),
}
