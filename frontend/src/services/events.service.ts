import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { CreateEventInput, EventItem, ListEventsQuery, UpdateEventInput } from '../types/events';

export interface ListEventsResult {
  events: EventItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const eventsService = {
  async listEvents(query?: ListEventsQuery): Promise<ListEventsResult> {
    const response = await apiClient.get<ApiResponse<ListEventsResult>>('/events', {
      params: query,
    });
    return response.data.data;
  },

  async getEventById(eventId: string): Promise<EventItem> {
    const response = await apiClient.get<ApiResponse<EventItem>>(`/events/${eventId}`);
    return response.data.data;
  },

  async createEvent(input: CreateEventInput): Promise<EventItem> {
    const response = await apiClient.post<ApiResponse<EventItem>>('/events', input);
    return response.data.data;
  },

  async updateEvent(eventId: string, input: UpdateEventInput): Promise<EventItem> {
    const response = await apiClient.patch<ApiResponse<EventItem>>(`/events/${eventId}`, input);
    return response.data.data;
  },

  async publishEvent(eventId: string): Promise<EventItem> {
    const response = await apiClient.post<ApiResponse<EventItem>>(`/events/${eventId}/publish`);
    return response.data.data;
  },

  async cancelEvent(eventId: string): Promise<EventItem> {
    const response = await apiClient.post<ApiResponse<EventItem>>(`/events/${eventId}/cancel`);
    return response.data.data;
  },
};
