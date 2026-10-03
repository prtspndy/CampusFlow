/**
 * Membership API service — wraps api.ts for membership-related backend calls.
 * Mirrors backend membership.service.ts response shapes.
 */
import { api } from '../../../lib/api'

// ─── Backend shape mirrors ──────────────────────────────────────────────────

export type BackendMembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REJECTED'

export type MembershipPlanType = 'annual' | 'semester' | 'lifetime'

export interface BackendMembership {
  id: string
  userId: string
  planName: string
  memberCode: string
  status: BackendMembershipStatus
  validFrom: string
  validUntil: string
  perks: string[]
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface ListMembershipsResponse {
  memberships: Array<
    BackendMembership & {
      user: { id: string; name: string; email: string }
    }
  >
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const membershipApiService = {
  /** Get the authenticated user's own membership records. */
  getOwnMembership: () =>
    api.get<BackendMembership[]>('/memberships/me'),

  /** Apply for a membership plan. */
  applyForMembership: (planName: MembershipPlanType) =>
    api.post<BackendMembership>('/memberships/apply', { planName }),

  /** Renew a membership. */
  renewMembership: (membershipId: string, planName: MembershipPlanType) =>
    api.post<BackendMembership>(`/memberships/${membershipId}/renew`, { planName }),

  /** List all memberships (admin/treasurer only). */
  listMemberships: (
    params: { page?: number; limit?: number; status?: string; search?: string } = {},
  ) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.status) qs.set('status', params.status)
    if (params.search) qs.set('search', params.search)
    const q = qs.toString()
    return api.get<ListMembershipsResponse>(`/memberships${q ? `?${q}` : ''}`)
  },

  /** Update membership status (admin only). */
  updateMembershipStatus: (
    membershipId: string,
    status: BackendMembershipStatus,
    adminNotes?: string,
  ) => api.patch<BackendMembership>(`/memberships/${membershipId}/status`, { status, adminNotes }),
}
