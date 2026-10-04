import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EventDetailPage } from '../features/events/EventDetailPage';
import { eventsService } from '../services/events.service';
import { registrationsService } from '../services/registrations.service';
import { paymentsService } from '../services/payments.service';
import { membershipsService } from '../services/memberships.service';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'usr-student-1', name: 'Alex Student', email: 'alex@campus.edu', role: 'MEMBER' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../services/events.service', () => ({
  eventsService: {
    getEventById: vi.fn(),
    publishEvent: vi.fn(),
    cancelEvent: vi.fn(),
  },
}));

vi.mock('../services/registrations.service', () => ({
  registrationsService: {
    registerForEvent: vi.fn(),
  },
}));

vi.mock('../services/payments.service', () => ({
  paymentsService: {
    createPaymentOrder: vi.fn(),
    verifyPayment: vi.fn(),
  },
}));

vi.mock('../services/memberships.service', () => ({
  membershipsService: {
    getMyMemberships: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../lib/razorpay', () => ({
  loadRazorpayCheckoutScript: vi.fn().mockResolvedValue(true),
}));

describe('EventDetailPage Checkout Modal & Booking Workflow', () => {
  const mockEvent = {
    id: 'evt-ai-summit',
    title: 'AI Innovations Summit 2026',
    description: 'Annual campus summit discussing breakthroughs in autonomous agents.',
    venue: 'Auditorium Hall A',
    category: 'TECH',
    startsAt: '2026-11-10T09:00:00.000Z',
    endsAt: '2026-11-10T17:00:00.000Z',
    status: 'PUBLISHED' as const,
    memberPrice: 350,
    standardPrice: 500,
    totalCapacity: 100,
    registeredCount: 10,
    isFeatured: true,
    organizerId: 'org-1',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventsService.getEventById).mockResolvedValue(mockEvent);
    vi.mocked(membershipsService.getMyMemberships).mockResolvedValue([]);
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/events/evt-ai-summit']}>
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders event pricing and live total correctly for quantity changes', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('AI Innovations Summit 2026')).toBeInTheDocument();
    });

    // Standard non-member rate is ₹500
    expect(screen.getByRole('button', { name: /Book 1 Ticket • ₹500/i })).toBeInTheDocument();

    // Increase quantity to 2
    const plusButton = screen.getByRole('button', { name: /Increase quantity/i });
    fireEvent.click(plusButton);

    expect(screen.getByRole('button', { name: /Book 2 Tickets • ₹1,000/i })).toBeInTheDocument();
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
  });

  it('opens checkout modal with authoritative amount, order ID, and no manual testing inputs', async () => {
    vi.mocked(registrationsService.registerForEvent).mockResolvedValueOnce({
      registration: {
        id: 'reg-summit-1',
        eventId: 'evt-ai-summit',
        userId: 'usr-student-1',
        status: 'PENDING_PAYMENT',
        tier: 'STANDARD',
        quantity: 2,
        amountPaise: 100000, // ₹1,000
        currency: 'INR',
        createdAt: '2026-10-04T00:00:00.000Z',
        updatedAt: '2026-10-04T00:00:00.000Z',
      },
      requiresPayment: true,
      ticket: null,
      tickets: [],
      paymentOrder: {
        razorpayOrderId: 'order_test_summit_123',
        amountPaise: 100000,
        currency: 'INR',
        keyId: 'rzp_test_campusflow',
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('AI Innovations Summit 2026')).toBeInTheDocument();
    });

    // Increase quantity to 2 and click book
    const plusButton = screen.getByRole('button', { name: /Increase quantity/i });
    fireEvent.click(plusButton);

    const bookButton = screen.getByRole('button', { name: /Book 2 Tickets • ₹1,000/i });
    fireEvent.click(bookButton);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Complete Ticket Purchase')).toBeInTheDocument();
    });

    // Verify Amount Payable is ₹1,000 and NEVER ₹NaN
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.queryByText(/₹NaN/i)).not.toBeInTheDocument();

    // Verify Order ID is rendered
    expect(screen.getByText(/Order ID: order_test_summit_123/i)).toBeInTheDocument();

    // Verify Checkout Button
    expect(
      screen.getByRole('button', { name: /Pay ₹1,000 with Razorpay/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Pay ₹NaN with Razorpay/i)).not.toBeInTheDocument();

    // Ensure the manual developer testing form is COMPLETELY REMOVED
    expect(screen.queryByText(/Developer \/ Testing Manual Verification/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/pay_test123/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Verification Signature/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit Verification/i })).not.toBeInTheDocument();
  });
});
