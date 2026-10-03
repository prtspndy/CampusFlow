import { apiClient } from '@/services/apiClient'
import { API_ENDPOINTS } from '@/services/endpoints'
import type { LoginCredentials, AuthResponse } from '../types/auth.types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
    return response.data
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  },
}
