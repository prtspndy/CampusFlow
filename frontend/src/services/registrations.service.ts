import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { EventRegistration, RegisterEventResult } from '../types/events';
import { Ticket } from '../types/ticketing';
import { paymentsService } from './payments.service';

export interface ListRegistrationsResult {
  registrations: EventRegistration[];
  total: number;
  page: number;
  limit: number;
}

export const registrationsService = {
  async registerForEvent(
    eventId: string,
    options?: { quantity?: number },
  ): Promise<RegisterEventResult> {
    const quantity = options?.quantity ?? 1;
    const response = await apiClient.post<
      ApiResponse<{
        registration: EventRegistration;
        ticket: Ticket | null;
        tickets?: Ticket[];
        payment: null;
      }>
    >(`/events/${eventId}/registrations`, { quantity });

    const data = response.data.data;
    const requiresPayment = data.registration.status === 'PENDING_PAYMENT';
    let paymentOrder: RegisterEventResult['paymentOrder'];

    if (requiresPayment) {
      const orderData = await paymentsService.createPaymentOrder(data.registration.id);
      const payment = orderData.payment;
      if (!payment?.razorpayOrderId) {
        throw new Error('Server failed to provide a valid Razorpay Order ID.');
      }
      if (
        typeof payment.amountPaise !== 'number' ||
        !Number.isFinite(payment.amountPaise) ||
        payment.amountPaise <= 0
      ) {
        throw new Error('Server returned an invalid order amount.');
      }
      paymentOrder = {
        razorpayOrderId: payment.razorpayOrderId,
        amountPaise: payment.amountPaise,
        currency: payment.currency || 'INR',
        keyId: payment.keyId,
      };
    }

    return {
      registration: data.registration,
      ticket: data.ticket,
      tickets: data.tickets,
      requiresPayment,
      paymentOrder,
    };
  },

  async listEventRegistrations(
    eventId: string,
    params?: { page?: number; limit?: number; status?: string },
  ): Promise<ListRegistrationsResult> {
    const response = await apiClient.get<ApiResponse<ListRegistrationsResult>>(
      `/events/${eventId}/registrations`,
      { params },
    );
    return response.data.data;
  },

  async getMyRegistrations(params?: { page?: number; limit?: number }): Promise<ListRegistrationsResult> {
    const response = await apiClient.get<ApiResponse<ListRegistrationsResult>>('/registrations/me', {
      params,
    });
    return response.data.data;
  },

  async getRegistrationById(registrationId: string): Promise<EventRegistration> {
    const response = await apiClient.get<ApiResponse<EventRegistration>>(
      `/registrations/${registrationId}`,
    );
    return response.data.data;
  },

  async cancelRegistration(registrationId: string): Promise<EventRegistration> {
    const response = await apiClient.post<ApiResponse<EventRegistration>>(
      `/registrations/${registrationId}/cancel`,
    );
    return response.data.data;
  },
};
