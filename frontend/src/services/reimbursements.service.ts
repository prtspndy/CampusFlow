import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { Reimbursement, SettleReimbursementInput } from '../types/finance';

export interface ListReimbursementsResult {
  reimbursements: Reimbursement[];
  total: number;
  page: number;
  limit: number;
}

export const reimbursementsService = {
  async getMyReimbursements(): Promise<Reimbursement[]> {
    const response = await apiClient.get<ApiResponse<Reimbursement[]>>('/reimbursements/me');
    return response.data.data;
  },

  async listReimbursements(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ListReimbursementsResult> {
    const response = await apiClient.get<ApiResponse<ListReimbursementsResult>>('/reimbursements', {
      params,
    });
    return response.data.data;
  },

  async getReimbursement(id: string): Promise<Reimbursement> {
    const response = await apiClient.get<ApiResponse<Reimbursement>>(`/reimbursements/${id}`);
    return response.data.data;
  },

  async settleReimbursement(
    id: string,
    input: SettleReimbursementInput,
  ): Promise<{ id: string; status: string }> {
    const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
      `/reimbursements/${id}/settle`,
      input,
    );
    return response.data.data;
  },

  async rejectReimbursement(id: string, reason: string): Promise<{ id: string; status: string }> {
    const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
      `/reimbursements/${id}/reject`,
      { reason },
    );
    return response.data.data;
  },
};
