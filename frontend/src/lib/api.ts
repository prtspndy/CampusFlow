import { ENV } from '../config/env'
import type { ApiErrorDetail, ApiResponse } from '../types/api'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'campusflow_token',
  REFRESH_TOKEN: 'campusflow_refresh_token',
  USER_DATA: 'campusflow_user',
  ACTIVE_ROLE: 'campusflow_active_role',
} as const

export class ApiError extends Error {
  statusCode: number
  code: string
  details?: ApiErrorDetail[]

  constructor(message: string, statusCode: number, code: string = 'API_ERROR', details?: ApiErrorDetail[]) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
  skipAuth?: boolean
  _retryCount?: number
}

class ApiClient {
  private baseUrl: string
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    }
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  }

  private getAuthHeaders(skipAuth = false): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    if (!skipAuth) {
      const token = this.getAccessToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    return headers
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Refreshes the session using the stored refresh token.
   * Single-flight promise prevents concurrent requests from colliding.
   */
  private async refreshSession(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      return null
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
          this.clearTokens()
          return null
        }

        const json = await response.json()
        if (json.success && json.data?.token) {
          this.setTokens(json.data.token, json.data.refreshToken)
          return json.data.token as string
        }

        this.clearTokens()
        return null
      } catch {
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuth = false, _retryCount = 0, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)
    const headers = {
      ...this.getAuthHeaders(skipAuth),
      ...(fetchOptions.headers as Record<string, string>),
    }

    let response: Response
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      })
    } catch (networkError) {
      const err = networkError as Error
      throw new ApiError(
        `Network error: unable to reach CampusFlow API at ${this.baseUrl}. ${err.message}`,
        0,
        'NETWORK_ERROR',
      )
    }

    // Handle token expiration & automatic refresh on 401
    if (response.status === 401 && !skipAuth && _retryCount === 0 && !endpoint.includes('/auth/')) {
      const newToken = await this.refreshSession()
      if (newToken) {
        return this.request<T>(endpoint, {
          ...options,
          _retryCount: _retryCount + 1,
        })
      }
    }

    return this.parseResponse<T>(response)
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const payload = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      if (typeof payload === 'object' && payload !== null && 'error' in payload) {
        const errorBody = (payload as ApiResponse<unknown> & { error: { code: string; message: string; details?: ApiErrorDetail[] } }).error
        throw new ApiError(
          errorBody.message || 'API request failed',
          response.status,
          errorBody.code || 'UNKNOWN_ERROR',
          errorBody.details,
        )
      }

      const fallbackMsg = typeof payload === 'string' && payload ? payload : `HTTP error ${response.status}: ${response.statusText}`
      throw new ApiError(fallbackMsg, response.status, 'HTTP_ERROR')
    }

    if (typeof payload === 'object' && payload !== null && 'success' in payload) {
      const envelope = payload as ApiResponse<T>
      if (!envelope.success) {
        throw new ApiError(
          envelope.error?.message || 'API request indicated failure',
          response.status,
          envelope.error?.code || 'OPERATION_FAILED',
          envelope.error?.details,
        )
      }
      return envelope.data
    }

    return payload as T
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params })
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const api = new ApiClient(ENV.API_BASE_URL)
export const apiClient = api
