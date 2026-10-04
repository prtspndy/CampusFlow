import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentsService } from '../services/payments.service';
import { registrationsService } from '../services/registrations.service';
import { apiClient } from '../lib/api-client';

vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Payments & Ticketing Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('paymentsService.createPaymentOrder', () => {
    it('correctly unwraps nested backend response { payment, alreadyExisted }', async () => {
      const mockBackendResponse = {
        success: true,
        message: 'Payment order created',
        data: {
          payment: {
            id: 'pay-uuid-1',
            registrationId: 'reg-uuid-1',
            eventId: 'evt-uuid-1',
            userId: 'usr-uuid-1',
            status: 'CREATED',
            amountPaise: 50000,
            currency: 'INR',
            razorpayOrderId: 'order_test_998877',
            razorpayPaymentId: null,
            signatureVerifiedAt: null,
            keyId: 'rzp_test_campusflow',
          },
          alreadyExisted: false,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: mockBackendResponse,
      });

      const result = await paymentsService.createPaymentOrder('reg-uuid-1');

      expect(apiClient.post).toHaveBeenCalledWith('/registrations/reg-uuid-1/payment-order');
      expect(result.payment.razorpayOrderId).toBe('order_test_998877');
      expect(result.payment.amountPaise).toBe(50000);
      expect(result.payment.currency).toBe('INR');
      expect(result.payment.keyId).toBe('rzp_test_campusflow');
      expect(result.alreadyExisted).toBe(false);
    });
  });

  describe('registrationsService.registerForEvent', () => {
    it('handles free event registration without creating a payment order', async () => {
      const freeRegistration = {
        id: 'reg-free-1',
        eventId: 'evt-free',
        userId: 'usr-1',
        status: 'CONFIRMED',
        tier: 'STANDARD',
        quantity: 1,
        amountPaise: 0,
        currency: 'INR',
        createdAt: '2026-10-04T00:00:00.000Z',
        updatedAt: '2026-10-04T00:00:00.000Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Registration confirmed',
          data: {
            registration: freeRegistration,
            ticket: { id: 't-1', status: 'ISSUED', qrToken: 'cf_token_1' },
            tickets: [{ id: 't-1', status: 'ISSUED', qrToken: 'cf_token_1' }],
            payment: null,
          },
        },
      });

      const result = await registrationsService.registerForEvent('evt-free', { quantity: 1 });

      expect(result.requiresPayment).toBe(false);
      expect(result.paymentOrder).toBeUndefined();
      expect(result.tickets).toHaveLength(1);
    });

    it('handles single ticket paid registration and correctly extracts paymentOrder', async () => {
      const pendingRegistration = {
        id: 'reg-paid-1',
        eventId: 'evt-paid',
        userId: 'usr-1',
        status: 'PENDING_PAYMENT',
        tier: 'STANDARD',
        quantity: 1,
        amountPaise: 50000,
        currency: 'INR',
        createdAt: '2026-10-04T00:00:00.000Z',
        updatedAt: '2026-10-04T00:00:00.000Z',
      };

      // 1. Initial registration POST
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Registration reserved pending payment',
          data: {
            registration: pendingRegistration,
            ticket: null,
            tickets: [],
            payment: null,
          },
        },
      });

      // 2. Subsequent payment-order POST
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Payment order created',
          data: {
            payment: {
              id: 'p-1',
              registrationId: 'reg-paid-1',
              eventId: 'evt-paid',
              userId: 'usr-1',
              status: 'CREATED',
              amountPaise: 50000,
              currency: 'INR',
              razorpayOrderId: 'order_paid_single',
              keyId: 'rzp_test_campusflow',
            },
            alreadyExisted: false,
          },
        },
      });

      const result = await registrationsService.registerForEvent('evt-paid', { quantity: 1 });

      expect(result.requiresPayment).toBe(true);
      expect(result.paymentOrder).toBeDefined();
      expect(result.paymentOrder?.razorpayOrderId).toBe('order_paid_single');
      expect(result.paymentOrder?.amountPaise).toBe(50000);
      expect(result.paymentOrder?.currency).toBe('INR');
      expect(result.paymentOrder?.keyId).toBe('rzp_test_campusflow');
    });

    it('handles multi-quantity paid booking and maps authoritative multi-ticket total', async () => {
      const pendingMultiReg = {
        id: 'reg-multi-3',
        eventId: 'evt-paid',
        userId: 'usr-1',
        status: 'PENDING_PAYMENT',
        tier: 'STANDARD',
        quantity: 3,
        amountPaise: 150000, // 3 * ₹500
        currency: 'INR',
        createdAt: '2026-10-04T00:00:00.000Z',
        updatedAt: '2026-10-04T00:00:00.000Z',
      };

      // 1. Registration call with quantity 3
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Registration reserved pending payment',
          data: {
            registration: pendingMultiReg,
            ticket: null,
            tickets: [],
            payment: null,
          },
        },
      });

      // 2. Payment order call
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Payment order created',
          data: {
            payment: {
              id: 'p-multi',
              registrationId: 'reg-multi-3',
              eventId: 'evt-paid',
              userId: 'usr-1',
              status: 'CREATED',
              amountPaise: 150000,
              currency: 'INR',
              razorpayOrderId: 'order_multi_3',
              keyId: 'rzp_test_campusflow',
            },
            alreadyExisted: false,
          },
        },
      });

      const result = await registrationsService.registerForEvent('evt-paid', { quantity: 3 });

      expect(apiClient.post).toHaveBeenNthCalledWith(1, '/events/evt-paid/registrations', { quantity: 3 });
      expect(result.registration.quantity).toBe(3);
      expect(result.paymentOrder?.razorpayOrderId).toBe('order_multi_3');
      expect(result.paymentOrder?.amountPaise).toBe(150000);
    });

    it('throws an error when the backend order creation returns a missing Razorpay Order ID', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Registration reserved pending payment',
          data: {
            registration: {
              id: 'reg-bad-1',
              status: 'PENDING_PAYMENT',
              quantity: 1,
            },
            ticket: null,
            tickets: [],
            payment: null,
          },
        },
      });

      // Backend returns payment without razorpayOrderId
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Payment order created',
          data: {
            payment: {
              id: 'p-bad',
              amountPaise: 50000,
              razorpayOrderId: null, // missing!
            },
            alreadyExisted: false,
          },
        },
      });

      await expect(registrationsService.registerForEvent('evt-paid')).rejects.toThrow(
        /Server failed to provide a valid Razorpay Order ID/,
      );
    });

    it('throws an error when the backend order creation returns an invalid non-positive amount', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Registration reserved pending payment',
          data: {
            registration: {
              id: 'reg-bad-2',
              status: 'PENDING_PAYMENT',
              quantity: 1,
            },
            ticket: null,
            tickets: [],
            payment: null,
          },
        },
      });

      // Backend returns payment with non-positive amount
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Payment order created',
          data: {
            payment: {
              id: 'p-bad-2',
              amountPaise: 0,
              razorpayOrderId: 'order_zero',
            },
            alreadyExisted: false,
          },
        },
      });

      await expect(registrationsService.registerForEvent('evt-paid')).rejects.toThrow(
        /Server returned an invalid order amount/,
      );
    });
  });

  describe('paymentsService.verifyPayment', () => {
    it('verifies payment with order ID, payment ID, and HMAC signature returning all issued tickets', async () => {
      const verifyInput = {
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'valid_signature_abc',
      };

      const mockVerifyResponse = {
        payment: {
          id: 'pay-1',
          registrationId: 'reg-1',
          status: 'PAID',
          amountPaise: 100000,
          currency: 'INR',
          razorpayOrderId: 'order_test_123',
          razorpayPaymentId: 'pay_test_456',
        },
        registration: {
          id: 'reg-1',
          status: 'CONFIRMED',
          quantity: 2,
        },
        tickets: [
          { id: 'ticket-1', status: 'ISSUED', qrToken: 'cf_token_1' },
          { id: 'ticket-2', status: 'ISSUED', qrToken: 'cf_token_2' },
        ],
        ticket: { id: 'ticket-1', status: 'ISSUED', qrToken: 'cf_token_1' },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Payment verified',
          data: mockVerifyResponse,
        },
      });

      const response = await paymentsService.verifyPayment(verifyInput);

      expect(apiClient.post).toHaveBeenCalledWith('/payments/verify', verifyInput);
      expect(response.payment.status).toBe('PAID');
      expect(response.registration.status).toBe('CONFIRMED');
      expect(response.tickets).toHaveLength(2);
      expect(response.tickets[0].id).toBe('ticket-1');
      expect(response.tickets[1].id).toBe('ticket-2');
    });

    it('propagates verification failure when backend rejects the payment verification', async () => {
      const verifyInput = {
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'invalid_signature',
      };

      const verificationError = new Error('Payment signature is invalid');
      vi.mocked(apiClient.post).mockRejectedValueOnce(verificationError);

      await expect(paymentsService.verifyPayment(verifyInput)).rejects.toThrow(
        'Payment signature is invalid',
      );
    });
  });
});
