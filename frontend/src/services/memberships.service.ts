import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import {
  ApplyMembershipInput,
  ListMembershipsQuery,
  Membership,
  RenewMembershipInput,
  UpdateMembershipStatusInput,
} from '../types/membership';

export interface ListMembershipsResult {
  memberships: Membership[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const membershipsService = {
  async apply(input: ApplyMembershipInput): Promise<Membership> {
    const response = await apiClient.post<ApiResponse<Membership>>('/memberships/apply', input);
    return response.data.data;
  },

  async getMyMemberships(): Promise<Membership[]> {
    const response = await apiClient.get<ApiResponse<Membership[]>>('/memberships/me');
    return response.data.data;
  },

  async listMemberships(query?: ListMembershipsQuery): Promise<ListMembershipsResult> {
    const response = await apiClient.get<
      ApiResponse<
        ListMembershipsResult & {
          pagination?: { total?: number; page?: number; limit?: number; totalPages?: number };
        }
      >
    >('/memberships', { params: query });
    const data = response.data.data;
    const pagination = data?.pagination;
    return {
      memberships: data?.memberships ?? [],
      total: data?.total ?? pagination?.total ?? 0,
      page: data?.page ?? pagination?.page ?? query?.page ?? 1,
      limit: data?.limit ?? pagination?.limit ?? query?.limit ?? 20,
      totalPages: data?.totalPages ?? pagination?.totalPages ?? 1,
    };
  },

  async getMembershipById(id: string): Promise<Membership> {
    const response = await apiClient.get<ApiResponse<Membership>>(`/memberships/${id}`);
    return response.data.data;
  },

  async renew(id: string, input?: RenewMembershipInput): Promise<Membership> {
    const response = await apiClient.post<ApiResponse<Membership>>(`/memberships/${id}/renew`, input || {});
    return response.data.data;
  },

  async updateStatus(id: string, input: UpdateMembershipStatusInput): Promise<Membership> {
    const response = await apiClient.patch<ApiResponse<Membership>>(`/memberships/${id}/status`, input);
    return response.data.data;
  },
};
