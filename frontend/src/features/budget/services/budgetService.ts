import { apiClient } from '@/services/apiClient'
import { API_ENDPOINTS } from '@/services/endpoints'
import type { ClubBudgetSummary, ExpenseItem } from '../types/budget.types'

export const budgetService = {
  async getBudgetSummary(clubId: string): Promise<ClubBudgetSummary> {
    const response = await apiClient.get<ClubBudgetSummary>(API_ENDPOINTS.BUDGET.OVERVIEW(clubId))
    return response.data
  },

  async getExpenses(clubId: string): Promise<ExpenseItem[]> {
    const response = await apiClient.get<ExpenseItem[]>(API_ENDPOINTS.BUDGET.EXPENSES(clubId))
    return response.data
  },
}
