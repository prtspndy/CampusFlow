import { api } from '../lib/api'
import type {
  Fundraiser,
  FundraiserContribution,
  FundraiserStatus,
  ContributionStatus,
} from '../types/models'

export interface CreateFundraiserPayload {
  title: string
  description: string
  purpose?: string
  goalAmount: number
  currency?: string
  startsAt?: string | null
  endsAt?: string | null
  status?: FundraiserStatus
}

export interface UpdateFundraiserPayload {
  title?: string
  description?: string
  purpose?: string
  goalAmount?: number
  currency?: string
  startsAt?: string | null
  endsAt?: string | null
  status?: FundraiserStatus
}

export interface ListFundraisersQuery {
  status?: FundraiserStatus
  page?: number
  limit?: number
}

export interface ListFundraisersResponse {
  fundraisers: Fundraiser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ContributePayload {
  amount: number
  currency?: string
  donorName: string
  donorEmail: string
  paymentMethod: 'CASH' | 'ONLINE'
  idempotencyKey?: string
}

export interface ContributionResult {
  contribution: FundraiserContribution
  alreadyExisted?: boolean
  razorpayOrder?: {
    id: string
    amount: number
    currency: string
  } | null
}

export interface VerifyContributionPayload {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export interface ListContributionsQuery {
  status?: ContributionStatus
  page?: number
  limit?: number
}

export interface ListContributionsResponse {
  contributions: FundraiserContribution[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const fundraiserService = {
  async listFundraisers(params?: ListFundraisersQuery): Promise<ListFundraisersResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<ListFundraisersResponse>(`/fundraisers${query}`)
  },

  async getFundraiser(id: string): Promise<Fundraiser> {
    return api.get<Fundraiser>(`/fundraisers/${id}`)
  },

  async createFundraiser(payload: CreateFundraiserPayload): Promise<Fundraiser> {
    return api.post<Fundraiser>('/fundraisers', payload)
  },

  async updateFundraiser(id: string, payload: UpdateFundraiserPayload): Promise<Fundraiser> {
    return api.patch<Fundraiser>(`/fundraisers/${id}`, payload)
  },

  async publishFundraiser(id: string): Promise<Fundraiser> {
    return api.post<Fundraiser>(`/fundraisers/${id}/publish`)
  },

  async closeFundraiser(id: string): Promise<Fundraiser> {
    return api.post<Fundraiser>(`/fundraisers/${id}/close`)
  },

  async contribute(fundraiserId: string, payload: ContributePayload): Promise<ContributionResult> {
    return api.post<ContributionResult>(`/fundraisers/${fundraiserId}/contributions`, payload)
  },

  async verifyContribution(payload: VerifyContributionPayload): Promise<{ contribution: FundraiserContribution; verified: boolean }> {
    return api.post<{ contribution: FundraiserContribution; verified: boolean }>('/fundraisers/verify', payload)
  },

  async listContributions(fundraiserId: string, params?: ListContributionsQuery): Promise<ListContributionsResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<ListContributionsResponse>(`/fundraisers/${fundraiserId}/contributions${query}`)
  },
}
