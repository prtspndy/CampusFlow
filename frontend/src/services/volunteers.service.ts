import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import {
  CreateOpportunityInput,
  UpdateAttendanceInput,
  UpdateOpportunityInput,
  VolunteerOpportunity,
  VolunteerRegistration,
} from '../types/volunteers';

export interface ListOpportunitiesResult {
  opportunities: VolunteerOpportunity[];
  total: number;
  page: number;
  limit: number;
}

export const volunteersService = {
  async listOpportunities(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ListOpportunitiesResult> {
    const response = await apiClient.get<ApiResponse<ListOpportunitiesResult>>(
      '/volunteers/opportunities',
      { params },
    );
    return response.data.data;
  },

  async getOpportunity(id: string): Promise<VolunteerOpportunity> {
    const response = await apiClient.get<ApiResponse<VolunteerOpportunity>>(
      `/volunteers/opportunities/${id}`,
    );
    return response.data.data;
  },

  async createOpportunity(input: CreateOpportunityInput): Promise<VolunteerOpportunity> {
    const response = await apiClient.post<ApiResponse<VolunteerOpportunity>>(
      '/volunteers/opportunities',
      input,
    );
    return response.data.data;
  },

  async updateOpportunity(id: string, input: UpdateOpportunityInput): Promise<VolunteerOpportunity> {
    const response = await apiClient.patch<ApiResponse<VolunteerOpportunity>>(
      `/volunteers/opportunities/${id}`,
      input,
    );
    return response.data.data;
  },

  async publishOpportunity(id: string): Promise<VolunteerOpportunity> {
    const response = await apiClient.post<ApiResponse<VolunteerOpportunity>>(
      `/volunteers/opportunities/${id}/publish`,
    );
    return response.data.data;
  },

  async closeOpportunity(id: string): Promise<VolunteerOpportunity> {
    const response = await apiClient.post<ApiResponse<VolunteerOpportunity>>(
      `/volunteers/opportunities/${id}/close`,
    );
    return response.data.data;
  },

  async cancelOpportunity(id: string): Promise<VolunteerOpportunity> {
    const response = await apiClient.post<ApiResponse<VolunteerOpportunity>>(
      `/volunteers/opportunities/${id}/cancel`,
    );
    return response.data.data;
  },

  async signup(id: string, notes?: string): Promise<VolunteerRegistration> {
    const response = await apiClient.post<ApiResponse<VolunteerRegistration>>(
      `/volunteers/opportunities/${id}/signups`,
      { notes },
    );
    return response.data.data;
  },

  async getMySignups(): Promise<VolunteerRegistration[]> {
    const response = await apiClient.get<ApiResponse<VolunteerRegistration[]>>(
      '/volunteers/signups/me',
    );
    return response.data.data;
  },

  async cancelSignup(signupId: string): Promise<VolunteerRegistration> {
    const response = await apiClient.post<ApiResponse<VolunteerRegistration>>(
      `/volunteers/signups/${signupId}/cancel`,
    );
    return response.data.data;
  },

  async listParticipants(opportunityId: string): Promise<VolunteerRegistration[]> {
    const response = await apiClient.get<ApiResponse<VolunteerRegistration[]>>(
      `/volunteers/opportunities/${opportunityId}/participants`,
    );
    return response.data.data;
  },

  async updateAttendance(
    signupId: string,
    input: UpdateAttendanceInput,
  ): Promise<VolunteerRegistration> {
    const response = await apiClient.patch<ApiResponse<VolunteerRegistration>>(
      `/volunteers/signups/${signupId}/attendance`,
      input,
    );
    return response.data.data;
  },
};
