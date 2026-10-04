import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { FinanceSummary, LedgerTransaction, RawFinanceSummary } from '../types/finance';

export interface ListLedgerResult {
  transactions: LedgerTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const financeService = {
  async getSummary(): Promise<FinanceSummary> {
    const response = await apiClient.get<ApiResponse<RawFinanceSummary>>('/finance/summary');
    const raw = response.data?.data;
    if (!raw) {
      throw new Error('Finance summary data not available');
    }

    const categoryBreakdown: Record<string, number> = {};
    if (Array.isArray(raw.expensesByCategory)) {
      for (const item of raw.expensesByCategory) {
        categoryBreakdown[item.category] = item.amount;
      }
    }

    return {
      ...raw,
      inflow: {
        eventRegistrations: raw.totalTicketRevenue ?? 0,
        fundraisers: raw.totalVerifiedFundraiserContributions ?? 0,
        totalInflow: raw.totalInflows ?? 0,
      },
      outflow: {
        settledReimbursements: raw.totalSettledReimbursements ?? 0,
        totalOutflow: raw.totalOutflows ?? 0,
      },
      netBalance: raw.netTreasuryBalance ?? 0,
      pendingLiabilities: {
        pendingExpenses: raw.totalPendingExpenses ?? 0,
        unsettledReimbursements: raw.outstandingReimbursementObligations ?? 0,
        totalPending:
          (raw.totalPendingExpenses ?? 0) +
          (raw.outstandingReimbursementObligations ?? 0),
      },
      categoryBreakdown,
    };
  },

  async getLedger(params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ListLedgerResult> {
    const response = await apiClient.get<ApiResponse<ListLedgerResult>>('/finance/ledger', {
      params,
    });
    const result = response.data?.data;
    if (!result) {
      return { transactions: [], total: 0, page: 1, limit: params?.limit || 20 };
    }

    return {
      ...result,
      transactions: (result.transactions || []).map((tx) => ({
        ...tx,
        type: tx.type || (tx.amount >= 0 ? 'INFLOW' : 'OUTFLOW'),
        amount: Math.abs(tx.amount),
      })),
    };
  },

  async downloadLedgerCsv(): Promise<void> {
    // Note requirement 9.11: The CSV endpoint returns text/csv. Download correctly without parsing as JSON.
    const response = await apiClient.get('/finance/export', {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campusflow_ledger_export.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
