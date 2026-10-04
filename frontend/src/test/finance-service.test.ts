import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeService } from '../services/finance.service';
import { apiClient } from '../lib/api-client';

vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('financeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('correctly maps raw backend finance summary into structured FinanceSummary', async () => {
      const mockRawBackendSummary = {
        currency: 'INR',
        totalApprovedExpenses: 14250,
        totalPendingExpenses: 3200,
        totalRejectedExpenses: 1800,
        totalSettledReimbursements: 10800,
        outstandingReimbursementObligations: 3450,
        totalVerifiedFundraiserContributions: 85000,
        totalTicketRevenue: 42500,
        totalMerchRevenue: 19500,
        totalInflows: 147000,
        totalOutflows: 10800,
        netTreasuryBalance: 136200,
        expensesByCategory: [
          { category: 'EQUIPMENT', amount: 7500, count: 2 },
          { category: 'SUPPLIES', amount: 4250, count: 3 },
        ],
        contributionsByFundraiser: [
          {
            fundraiserId: 'f123',
            fundraiserTitle: 'Solar Car',
            amount: 85000,
            count: 12,
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Finance summary retrieved successfully',
          data: mockRawBackendSummary,
        },
      });

      const summary = await financeService.getSummary();

      expect(summary.netBalance).toBe(136200);
      expect(summary.netTreasuryBalance).toBe(136200);
      expect(summary.inflow.totalInflow).toBe(147000);
      expect(summary.inflow.eventRegistrations).toBe(42500);
      expect(summary.inflow.fundraisers).toBe(85000);
      expect(summary.outflow.totalOutflow).toBe(10800);
      expect(summary.outflow.settledReimbursements).toBe(10800);
      expect(summary.pendingLiabilities.totalPending).toBe(3200 + 3450);
      expect(summary.categoryBreakdown.EQUIPMENT).toBe(7500);
      expect(summary.categoryBreakdown.SUPPLIES).toBe(4250);
    });

    it('handles zero values and empty categories gracefully', async () => {
      const mockRawBackendSummary = {
        currency: 'INR',
        totalApprovedExpenses: 0,
        totalPendingExpenses: 0,
        totalRejectedExpenses: 0,
        totalSettledReimbursements: 0,
        outstandingReimbursementObligations: 0,
        totalVerifiedFundraiserContributions: 0,
        totalTicketRevenue: 0,
        totalMerchRevenue: 0,
        totalInflows: 0,
        totalOutflows: 0,
        netTreasuryBalance: 0,
        expensesByCategory: [],
        contributionsByFundraiser: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Finance summary retrieved successfully',
          data: mockRawBackendSummary,
        },
      });

      const summary = await financeService.getSummary();

      expect(summary.netBalance).toBe(0);
      expect(summary.inflow.totalInflow).toBe(0);
      expect(summary.outflow.totalOutflow).toBe(0);
      expect(summary.pendingLiabilities.totalPending).toBe(0);
      expect(summary.categoryBreakdown).toEqual({});
    });
  });

  describe('getLedger', () => {
    it('normalizes ledger transactions with types and positive amounts', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            transactions: [
              {
                id: 'reimb-1',
                date: '2026-10-03',
                description: 'Reimbursement',
                category: 'EXPENSE',
                amount: -450,
                status: 'COMPLETED',
                source: 'Treasury',
              },
              {
                id: 'ticket-1',
                date: '2026-10-03',
                description: 'Ticket Sale',
                category: 'TICKETS',
                amount: 1200,
                status: 'COMPLETED',
                source: 'Ticketing',
              },
            ],
            total: 2,
            page: 1,
            limit: 5,
          },
        },
      });

      const ledger = await financeService.getLedger();

      expect(ledger.transactions[0].type).toBe('OUTFLOW');
      expect(ledger.transactions[0].amount).toBe(450);
      expect(ledger.transactions[1].type).toBe('INFLOW');
      expect(ledger.transactions[1].amount).toBe(1200);
    });
  });
});
