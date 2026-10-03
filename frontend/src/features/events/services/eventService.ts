import { apiClient } from '@/services/apiClient'
import { API_ENDPOINTS } from '@/services/endpoints'
import type { CampusEvent } from '../types/event.types'

export const eventService = {
  async getEvents(): Promise<CampusEvent[]> {
    const response = await apiClient.get<CampusEvent[]>(API_ENDPOINTS.EVENTS.LIST)
    return response.data
  },

  async getEventById(id: string): Promise<CampusEvent> {
    const response = await apiClient.get<CampusEvent>(API_ENDPOINTS.EVENTS.DETAILS(id))
    return response.data
  },

  async rsvpEvent(id: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.EVENTS.RSVP(id))
  },
}
