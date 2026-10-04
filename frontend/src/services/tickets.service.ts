import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { AttendanceRecord, CheckInAttendeeResponse, CheckInResult, Ticket, TicketValidationResponse } from '../types/ticketing';

export interface ListTicketsResult {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface ListAttendanceResult {
  attendance: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

export const ticketsService = {
  async getMyTickets(params?: { page?: number; limit?: number }): Promise<ListTicketsResult> {
    const response = await apiClient.get<ApiResponse<ListTicketsResult>>('/tickets/me', { params });
    return response.data.data;
  },

  async getTicketById(ticketId: string): Promise<Ticket> {
    const response = await apiClient.get<ApiResponse<Ticket>>(`/tickets/${ticketId}`);
    return response.data.data;
  },

  async getTicketQr(ticketId: string): Promise<Ticket> {
    const response = await apiClient.get<ApiResponse<Ticket>>(`/tickets/${ticketId}/qr`);
    return response.data.data;
  },

  async validateTicket(eventId: string, token: string): Promise<TicketValidationResponse> {
    const response = await apiClient.post<ApiResponse<TicketValidationResponse>>(
      `/events/${eventId}/tickets/validate`,
      { token },
    );
    return response.data.data;
  },

  async checkInAttendee(eventId: string, token: string): Promise<CheckInAttendeeResponse> {
    const response = await apiClient.post<ApiResponse<CheckInAttendeeResponse>>(
      `/events/${eventId}/check-in`,
      { token },
    );
    return response.data.data;
  },

  async listAttendance(
    eventId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ListAttendanceResult> {
    const response = await apiClient.get<ApiResponse<ListAttendanceResult>>(
      `/events/${eventId}/attendance`,
      { params },
    );
    return response.data.data;
  },
};
