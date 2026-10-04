import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { CreateExpenseInput, Expense, UpdateExpenseInput } from '../types/finance';

export interface ListExpensesResult {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
}

export const expensesService = {
  async submitExpense(input: CreateExpenseInput): Promise<Expense> {
    const response = await apiClient.post<ApiResponse<Expense>>('/expenses', input);
    return response.data.data;
  },

  async getMyExpenses(): Promise<Expense[]> {
    const response = await apiClient.get<ApiResponse<Expense[]>>('/expenses/me');
    return response.data.data;
  },

  async listExpenses(params?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ListExpensesResult> {
    const response = await apiClient.get<ApiResponse<ListExpensesResult>>('/expenses', { params });
    return response.data.data;
  },

  async getExpense(id: string): Promise<Expense> {
    const response = await apiClient.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return response.data.data;
  },

  async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const response = await apiClient.patch<ApiResponse<Expense>>(`/expenses/${id}`, input);
    return response.data.data;
  },

  async withdrawExpense(id: string): Promise<{ id: string }> {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/expenses/${id}`);
    return response.data.data;
  },

  async approveExpense(id: string): Promise<{ id: string; status: string }> {
    const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
      `/expenses/${id}/approve`,
    );
    return response.data.data;
  },

  async rejectExpense(id: string, reason: string): Promise<{ id: string; status: string }> {
    const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
      `/expenses/${id}/reject`,
      { reason },
    );
    return response.data.data;
  },
};
