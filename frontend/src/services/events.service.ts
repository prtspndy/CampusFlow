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

interface EventsListPayload {
  events?: EventItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

function normalizeEventsList(
  data: EventsListPayload | undefined,
  query?: ListEventsQuery,
): ListEventsResult {
  const pagination = data?.pagination;
  const limit = data?.limit ?? pagination?.limit ?? query?.limit ?? 20;
  const total = data?.total ?? pagination?.total ?? data?.events?.length ?? 0;
  return {
    events: data?.events ?? [],
    total,
    page: data?.page ?? pagination?.page ?? query?.page ?? 1,
    limit,
    totalPages: data?.totalPages ?? pagination?.totalPages ?? (Math.ceil(total / limit) || 1),
  };
}

export const eventsService = {
  async listEvents(query?: ListEventsQuery): Promise<ListEventsResult> {
    const response = await apiClient.get<ApiResponse<EventsListPayload>>('/events', {
      params: query,
    });
    return normalizeEventsList(response.data.data, query);
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
