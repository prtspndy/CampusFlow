import { session } from './session'

/**
 * HTTP client for the CampusFlow backend.
 *
 * - Unwraps the `{ success, data }` envelope and throws `ApiError` for failures.
 * - Sends the bearer access token on authenticated calls.
 * - When the backend answers `401 TOKEN_EXPIRED`, rotates the refresh token once
 *   (single-flight, so parallel requests share one refresh) and retries.
 */

const rawBase = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL
export const API_BASE_URL: string = (
  typeof rawBase === 'string' && rawBase.length > 0 ? rawBase : 'http://localhost:5000/api'
).replace(/\/+$/, '')

export interface ApiFieldError {
  field: string
  message: string
}

interface ErrorEnvelope {
  success: false
  error: { code: string; message: string; details?: unknown[] }
}

interface SuccessEnvelope<T> {
  success: true
  message?: string
  data: T
}

type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiFieldError[]

  constructor(status: number, code: string, message: string, details: ApiFieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** Field-level messages keyed by field name, for inline form errors. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]))
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Send the bearer token and refresh on expiry. Defaults to true. */
  auth?: boolean
  signal?: AbortSignal
}

let sessionExpiredHandler: (() => void) | null = null

/** Called once when a refresh fails and the stored session has been cleared. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler
}

async function parseEnvelope<T>(response: Response): Promise<Envelope<T> | null> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return (await response.json()) as Envelope<T>
  } catch {
    return null
  }
}

function toApiError(response: Response, payload: Envelope<unknown> | null): ApiError {
  if (payload && !payload.success) {
    const details = Array.isArray(payload.error.details)
      ? payload.error.details.filter(
          (d): d is ApiFieldError =>
            typeof d === 'object' &&
            d !== null &&
            typeof (d as ApiFieldError).field === 'string' &&
            typeof (d as ApiFieldError).message === 'string',
        )
      : []
    return new ApiError(response.status, payload.error.code, payload.error.message, details)
  }
  if (response.status === 429) {
    return new ApiError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.')
  }
  return new ApiError(
    response.status,
    'REQUEST_FAILED',
    response.statusText || 'The request could not be completed.',
  )
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = session.getRefreshToken()
      if (!refreshToken) return false
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      const payload = await parseEnvelope<{ token: string; refreshToken: string }>(response)
      if (!response.ok || !payload || !payload.success) return false
      session.setTokens({ accessToken: payload.data.token, refreshToken: payload.data.refreshToken })
      return true
    })()
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const useAuth = options.auth !== false
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const accessToken = useAuth ? session.getAccessToken() : null
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the CampusFlow server. Check your connection.')
  }

  const payload = await parseEnvelope<T>(response)
  if (response.ok && payload && payload.success) return payload.data

  const apiError = toApiError(response, payload)

  if (useAuth && !isRetry && apiError.status === 401 && apiError.code === 'TOKEN_EXPIRED') {
    if (await refreshSession()) return request<T>(path, options, true)
    session.clear()
    sessionExpiredHandler?.()
  }

  throw apiError
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
