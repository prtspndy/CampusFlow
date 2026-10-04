import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { Payment, PaymentVerifyResponse, VerifyPaymentInput } from '../types/ticketing';

export interface PaymentOrderResult {
  payment: Payment;
  alreadyExisted: boolean;
}

export interface ListPaymentsResult {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export const paymentsService = {
  async createPaymentOrder(registrationId: string): Promise<PaymentOrderResult> {
    const response = await apiClient.post<ApiResponse<PaymentOrderResult>>(
      `/registrations/${registrationId}/payment-order`,
    );
    return response.data.data;
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerifyResponse> {
    const response = await apiClient.post<ApiResponse<PaymentVerifyResponse>>('/payments/verify', input);
    return response.data.data;
  },

  async listPayments(params?: {
    eventId?: string;
    page?: number;
    limit?: number;
  }): Promise<ListPaymentsResult> {
    const response = await apiClient.get<ApiResponse<ListPaymentsResult>>('/payments', { params });
    return response.data.data;
  },

  async getPaymentById(paymentId: string): Promise<Payment> {
    const response = await apiClient.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
    return response.data.data;
  },
};
