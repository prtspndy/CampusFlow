import { api } from '../lib/api'
import type {
  VolunteerOpportunity,
  VolunteerRegistration,
  OpportunityStatus,
  VolunteerSignupStatus,
} from '../types/models'

export interface CreateOpportunityPayload {
  title: string
  description: string
  location: string
  startsAt: string
  endsAt: string
  applicationDeadline?: string | null
  capacity: number
  category?: string
  eligibility?: string
  eventId?: string
}

export interface UpdateOpportunityPayload {
  title?: string
  description?: string
  location?: string
  startsAt?: string
  endsAt?: string
  applicationDeadline?: string | null
  capacity?: number
  category?: string
  eligibility?: string
  eventId?: string
  status?: OpportunityStatus
}

export interface ListOpportunitiesQuery {
  status?: OpportunityStatus
  category?: string
  eventId?: string
  page?: number
  limit?: number
}

export interface ListOpportunitiesResponse {
  opportunities: VolunteerOpportunity[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SignupOpportunityPayload {
  notes?: string
}

export interface UpdateAttendancePayload {
  status: VolunteerSignupStatus
  attendanceNotes?: string
}

export interface ParticipantListResponse {
  opportunity: VolunteerOpportunity
  participants: VolunteerRegistration[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const volunteerService = {
  async listOpportunities(params?: ListOpportunitiesQuery): Promise<ListOpportunitiesResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.eventId) searchParams.set('eventId', params.eventId)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<ListOpportunitiesResponse>(`/volunteers/opportunities${query}`)
  },

  async getOpportunity(id: string): Promise<VolunteerOpportunity> {
    return api.get<VolunteerOpportunity>(`/volunteers/opportunities/${id}`)
  },

  async createOpportunity(payload: CreateOpportunityPayload): Promise<VolunteerOpportunity> {
    return api.post<VolunteerOpportunity>('/volunteers/opportunities', payload)
  },

  async updateOpportunity(id: string, payload: UpdateOpportunityPayload): Promise<VolunteerOpportunity> {
    return api.patch<VolunteerOpportunity>(`/volunteers/opportunities/${id}`, payload)
  },

  async publishOpportunity(id: string): Promise<VolunteerOpportunity> {
    return api.post<VolunteerOpportunity>(`/volunteers/opportunities/${id}/publish`)
  },

  async closeOpportunity(id: string): Promise<VolunteerOpportunity> {
    return api.post<VolunteerOpportunity>(`/volunteers/opportunities/${id}/close`)
  },

  async cancelOpportunity(id: string): Promise<VolunteerOpportunity> {
    return api.post<VolunteerOpportunity>(`/volunteers/opportunities/${id}/cancel`)
  },

  async signup(opportunityId: string, payload?: SignupOpportunityPayload): Promise<VolunteerRegistration> {
    return api.post<VolunteerRegistration>(`/volunteers/opportunities/${opportunityId}/signups`, payload ?? {})
  },

  async getMySignups(): Promise<VolunteerRegistration[]> {
    return api.get<VolunteerRegistration[]>('/volunteers/signups/me')
  },

  async cancelSignup(signupId: string): Promise<VolunteerRegistration> {
    return api.post<VolunteerRegistration>(`/volunteers/signups/${signupId}/cancel`)
  },

  async getParticipants(
    opportunityId: string,
    params?: { status?: VolunteerSignupStatus; page?: number; limit?: number }
  ): Promise<ParticipantListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<ParticipantListResponse>(`/volunteers/opportunities/${opportunityId}/participants${query}`)
  },

  async updateAttendance(signupId: string, payload: UpdateAttendancePayload): Promise<VolunteerRegistration> {
    return api.patch<VolunteerRegistration>(`/volunteers/signups/${signupId}/attendance`, payload)
  },
}
