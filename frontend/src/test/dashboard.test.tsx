import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';
import { TreasurerDashboard } from '../features/dashboard/TreasurerDashboard';
import { financeService } from '../services/finance.service';
import { usersService } from '../services/users.service';
import { membershipsService } from '../services/memberships.service';
import { eventsService } from '../services/events.service';
import { fundraisersService } from '../services/fundraisers.service';
import { expensesService } from '../services/expenses.service';
import { reimbursementsService } from '../services/reimbursements.service';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', name: 'Campus President', email: 'admin@campus.edu', role: 'ADMIN' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../services/finance.service', () => ({
  financeService: {
    getSummary: vi.fn(),
    getLedger: vi.fn(),
    downloadLedgerCsv: vi.fn(),
  },
}));

vi.mock('../services/users.service', () => ({
  usersService: {
    listUsers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/memberships.service', () => ({
  membershipsService: {
    listMemberships: vi.fn().mockResolvedValue({ memberships: [], total: 0 }),
  },
}));

vi.mock('../services/events.service', () => ({
  eventsService: {
    listEvents: vi.fn().mockResolvedValue({ events: [] }),
  },
}));

vi.mock('../services/fundraisers.service', () => ({
  fundraisersService: {
    listFundraisers: vi.fn().mockResolvedValue({ fundraisers: [] }),
  },
}));

vi.mock('../services/expenses.service', () => ({
  expensesService: {
    listExpenses: vi.fn().mockResolvedValue({ expenses: [] }),
  },
}));

vi.mock('../services/reimbursements.service', () => ({
  reimbursementsService: {
    listReimbursements: vi.fn().mockResolvedValue({ reimbursements: [] }),
  },
}));

vi.mock('../services/volunteers.service', () => ({
  volunteersService: {
    listOpportunities: vi.fn().mockResolvedValue({ opportunities: [], total: 0 }),
  },
}));

vi.mock('../services/products.service', () => ({
  productsService: {
    listProducts: vi.fn().mockResolvedValue({ products: [], total: 0 }),
  },
}));

describe('AdminDashboard & TreasurerDashboard rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AdminDashboard successfully with mapped finance data without crashing', async () => {
    vi.mocked(financeService.getSummary).mockResolvedValueOnce({
      currency: 'INR',
      netBalance: 136200,
      netTreasuryBalance: 136200,
      inflow: {
        totalInflow: 147000,
        eventRegistrations: 42500,
        fundraisers: 85000,
      },
      outflow: {
        totalOutflow: 10800,
        settledReimbursements: 10800,
      },
      pendingLiabilities: {
        totalPending: 6650,
        pendingExpenses: 3200,
        unsettledReimbursements: 3450,
      },
      categoryBreakdown: {},
    });

    vi.mocked(financeService.getLedger).mockResolvedValueOnce({
      transactions: [],
      total: 0,
      page: 1,
      limit: 5,
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    );

    // Initial heading is present
    expect(screen.getByText(/Welcome back, Campus/i)).toBeInTheDocument();

    // Wait for async load and card values
    await waitFor(() => {
      const netBalCard = screen.getByText(/Net Treasury Balance/i).closest('.rounded-xl');
      expect(netBalCard?.textContent).toContain('1,47,000');
      expect(netBalCard?.textContent).toContain('10,800');
    });
  });

  it('renders AdminDashboard safely even when finance API fails without throwing TypeError', async () => {
    vi.mocked(financeService.getSummary).mockRejectedValueOnce(new Error('Network error'));
    vi.mocked(financeService.getLedger).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Net Treasury Balance/i)).toBeInTheDocument();
    });

    // Fallbacks show dash rather than crashing
    expect(screen.getByText(/In —/i)).toBeInTheDocument();
    expect(screen.getByText(/Out —/i)).toBeInTheDocument();
  });

  it('renders TreasurerDashboard successfully without error', async () => {
    vi.mocked(financeService.getSummary).mockResolvedValueOnce({
      currency: 'INR',
      netBalance: 50000,
      netTreasuryBalance: 50000,
      inflow: { totalInflow: 80000, eventRegistrations: 50000, fundraisers: 30000 },
      outflow: { totalOutflow: 30000, settledReimbursements: 30000 },
      pendingLiabilities: { totalPending: 5000, pendingExpenses: 2000, unsettledReimbursements: 3000 },
      categoryBreakdown: {},
    });

    render(
      <MemoryRouter>
        <TreasurerDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Treasury & Financial Operations/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Total Inflows \(Rupees\)/i)).toBeInTheDocument();
    });
  });
});
