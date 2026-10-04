import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import {
  CreateContributionInput,
  CreateContributionResult,
  CreateFundraiserInput,
  Fundraiser,
  FundraiserContribution,
  FundraiserSummary,
  UpdateFundraiserInput,
  VerifyContributionInput,
  VerifyContributionResult,
} from '../types/fundraisers';

export interface ListFundraisersResult {
  fundraisers: Fundraiser[];
  total: number;
  page: number;
  limit: number;
}

export interface ListContributionsResult {
  contributions: FundraiserContribution[];
  total: number;
  page: number;
  limit: number;
}

export const fundraisersService = {
  async listFundraisers(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ListFundraisersResult> {
    const response = await apiClient.get<ApiResponse<ListFundraisersResult>>('/fundraisers', {
      params,
    });
    return response.data.data;
  },

  async getFundraiser(id: string): Promise<Fundraiser> {
    const response = await apiClient.get<ApiResponse<Fundraiser>>(`/fundraisers/${id}`);
    return response.data.data;
  },

  async createFundraiser(input: CreateFundraiserInput): Promise<Fundraiser> {
    const response = await apiClient.post<ApiResponse<Fundraiser>>('/fundraisers', input);
    return response.data.data;
  },

  async updateFundraiser(id: string, input: UpdateFundraiserInput): Promise<Fundraiser> {
    const response = await apiClient.patch<ApiResponse<Fundraiser>>(`/fundraisers/${id}`, input);
    return response.data.data;
  },

  async publishFundraiser(id: string): Promise<Fundraiser> {
    const response = await apiClient.post<ApiResponse<Fundraiser>>(`/fundraisers/${id}/publish`);
    return response.data.data;
  },

  async closeFundraiser(id: string): Promise<Fundraiser> {
    const response = await apiClient.post<ApiResponse<Fundraiser>>(`/fundraisers/${id}/close`);
    return response.data.data;
  },

  async createContribution(
    fundraiserId: string,
    input: CreateContributionInput,
  ): Promise<CreateContributionResult> {
    const response = await apiClient.post<ApiResponse<CreateContributionResult>>(
      `/fundraisers/${fundraiserId}/contributions`,
      input,
    );
    return response.data.data;
  },

  async verifyContribution(input: VerifyContributionInput): Promise<VerifyContributionResult> {
    const response = await apiClient.post<ApiResponse<VerifyContributionResult>>(
      '/fundraisers/verify',
      input,
    );
    return response.data.data;
  },

  async listContributions(
    fundraiserId: string,
    params?: { page?: number; limit?: number; status?: string },
  ): Promise<ListContributionsResult> {
    const response = await apiClient.get<ApiResponse<ListContributionsResult>>(
      `/fundraisers/${fundraiserId}/contributions`,
      { params },
    );
    return response.data.data;
  },

  async getSummary(fundraiserId: string): Promise<FundraiserSummary> {
    const response = await apiClient.get<ApiResponse<FundraiserSummary>>(
      `/fundraisers/${fundraiserId}/summary`,
    );
    return response.data.data;
  },

  async getMyDonations(): Promise<FundraiserContribution[]> {
    const response = await apiClient.get<ApiResponse<FundraiserContribution[]>>(
      '/fundraisers/my-donations',
    );
    return response.data.data;
  },
};
