import { apiClient } from '@/services/apiClient'
import { API_ENDPOINTS } from '@/services/endpoints'
import type { Club, ClubMember } from '../types/club.types'

export const clubService = {
  async getClubs(): Promise<Club[]> {
    const response = await apiClient.get<Club[]>(API_ENDPOINTS.CLUBS.LIST)
    return response.data
  },

  async getClubById(id: string): Promise<Club> {
    const response = await apiClient.get<Club>(API_ENDPOINTS.CLUBS.DETAILS(id))
    return response.data
  },

  async getClubMembers(clubId: string): Promise<ClubMember[]> {
    const response = await apiClient.get<ClubMember[]>(API_ENDPOINTS.CLUBS.MEMBERS(clubId))
    return response.data
  },
}
