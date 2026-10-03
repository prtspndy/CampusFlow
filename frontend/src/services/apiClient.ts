import { api, ApiError, STORAGE_KEYS } from '@/lib/api'
import type { ApiSuccessResponse } from '@/types/api'

class LegacyApiClient {
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiSuccessResponse<T>> {
    const data = await api.get<T>(endpoint, params)
    return { success: true, data }
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiSuccessResponse<T>> {
    const data = await api.post<T>(endpoint, body)
    return { success: true, data }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiSuccessResponse<T>> {
    const data = await api.put<T>(endpoint, body)
    return { success: true, data }
  }

  async delete<T>(endpoint: string): Promise<ApiSuccessResponse<T>> {
    const data = await api.delete<T>(endpoint)
    return { success: true, data }
  }
}

export const apiClient = new LegacyApiClient()
export { api, ApiError, STORAGE_KEYS }
export default apiClient
