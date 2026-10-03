import { api, API_BASE_URL } from '../lib/api'
import { session } from '../lib/session'
import type {
  Expense,
  Reimbursement,
  FinanceSummaryData,
  ExpenseStatus,
  ExpenseCategory,
  ReimbursementStatus,
} from '../types/models'

export interface SubmitExpensePayload {
  title: string
  description: string
  amount: number
  currency?: string
  category: ExpenseCategory
  expenseDate: string
  receiptUrl?: string
  eventId?: string
  fundraiserId?: string
}

export interface ReviewExpensePayload {
  decision: 'APPROVE' | 'REJECT'
  rejectionReason?: string
}

export interface ListExpensesQuery {
  status?: ExpenseStatus
  category?: ExpenseCategory
  eventId?: string
  fundraiserId?: string
  page?: number
  limit?: number
}

export interface ListExpensesResponse {
  expenses: Expense[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ListReimbursementsQuery {
  status?: ReimbursementStatus
  page?: number
  limit?: number
}

export interface ListReimbursementsResponse {
  reimbursements: Reimbursement[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SettleReimbursementPayload {
  settlementReference?: string
  notes?: string
}

export interface ListLedgerQuery {
  type?: 'ALL' | 'EXPENSES' | 'REIMBURSEMENTS' | 'CONTRIBUTIONS' | 'TICKET_SALES' | 'MERCH_ORDERS'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface LedgerEntry {
  id: string
  date: string
  type: string
  description: string
  category: string
  referenceId: string
  direction: 'INFLOW' | 'OUTFLOW'
  amount: number
  currency: string
  status: string
  counterparty?: string
}

export interface ListLedgerResponse {
  entries: LedgerEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const financeService = {
  async submitExpense(payload: SubmitExpensePayload): Promise<Expense> {
    return api.post<Expense>('/expenses', payload)
  },

  async listExpenses(params?: ListExpensesQuery): Promise<ListExpensesResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.eventId) searchParams.set('eventId', params.eventId)
    if (params?.fundraiserId) searchParams.set('fundraiserId', params.fundraiserId)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<ListExpensesResponse>(`/expenses${query}`)
  },

  async getExpense(id: string): Promise<Expense> {
    return api.get<Expense>(`/expenses/${id}`)
  },

  async reviewExpense(id: string, payload: ReviewExpensePayload): Promise<Expense> {
    return api.post<Expense>(`/expenses/${id}/review`, payload)
  },

  async listReimbursements(params?: ListReimbursementsQuery): Promise<ListReimbursementsResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<ListReimbursementsResponse>(`/reimbursements${query}`)
  },

  async getReimbursement(id: string): Promise<Reimbursement> {
    return api.get<Reimbursement>(`/reimbursements/${id}`)
  },

  async settleReimbursement(id: string, payload: SettleReimbursementPayload): Promise<Reimbursement> {
    return api.post<Reimbursement>(`/reimbursements/${id}/settle`, payload)
  },

  async getFinanceSummary(): Promise<FinanceSummaryData> {
    return api.get<FinanceSummaryData>('/finance/summary')
  },

  async getLedger(params?: ListLedgerQuery): Promise<ListLedgerResponse> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set('type', params.type)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<ListLedgerResponse>(`/finance/ledger${query}`)
  },

  async exportLedgerCsv(params?: { type?: string; startDate?: string; endDate?: string }): Promise<Blob> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set('type', params.type)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

    const token = session.getAccessToken()
    const response = await fetch(`${API_BASE_URL}/finance/ledger/export${query}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to export ledger CSV: ${response.statusText}`)
    }

    return response.blob()
  },
}
