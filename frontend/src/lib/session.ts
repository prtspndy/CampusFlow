/**
 * Browser storage for the current session. The keys match docs/API_CONTRACT.md §5.10.
 * The access token is a short-lived bearer JWT; the refresh token is sent only to /auth/refresh.
 */
const ACCESS_KEY = 'campusflow_token'
const REFRESH_KEY = 'campusflow_refresh_token'
const USER_KEY = 'campusflow_user'

const storage = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage)

export interface StoredTokens {
  accessToken: string
  refreshToken: string
}

export const session = {
  getAccessToken(): string | null {
    return storage()?.getItem(ACCESS_KEY) ?? null
  },
  getRefreshToken(): string | null {
    return storage()?.getItem(REFRESH_KEY) ?? null
  },
  hasTokens(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken())
  },
  setTokens({ accessToken, refreshToken }: StoredTokens): void {
    storage()?.setItem(ACCESS_KEY, accessToken)
    storage()?.setItem(REFRESH_KEY, refreshToken)
  },
  readCachedUser<T>(): T | null {
    const raw = storage()?.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      storage()?.removeItem(USER_KEY)
      return null
    }
  },
  cacheUser(user: unknown): void {
    storage()?.setItem(USER_KEY, JSON.stringify(user))
  },
  clear(): void {
    const store = storage()
    store?.removeItem(ACCESS_KEY)
    store?.removeItem(REFRESH_KEY)
    store?.removeItem(USER_KEY)
  },
}
