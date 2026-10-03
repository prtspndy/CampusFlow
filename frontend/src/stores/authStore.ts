import { create } from 'zustand'
import type { User } from '../types/models'
import type { UserRole } from '../lib/constants'
import { authApi, type ApiSession, type ApiUser } from '../lib/authApi'
import { isApiError, setSessionExpiredHandler } from '../lib/api'
import { session } from '../lib/session'

/**
 * `checking`      tokens exist and /auth/me has not answered yet
 * `anonymous`     no valid session
 * `authenticated` /auth/me confirmed the user, or a cached user is shown while offline
 */
export type AuthStatus = 'checking' | 'anonymous' | 'authenticated'

interface AuthState {
  user: User | null
  status: AuthStatus
  /** Confirms a stored session with the server. Call once on app start. */
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<User>
  /** Creates a member account, then signs in with the same credentials. */
  register: (name: string, email: string, password: string) => Promise<User>
  /** Revokes the session on the server and clears it locally. */
  logout: () => Promise<void>
  updateName: (name: string) => Promise<User>
  clearSession: () => void
}

/** Backend roles are lowercase; the UI's role constants are uppercase. */
export function toClientUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role.toUpperCase() as UserRole,
    status: apiUser.status,
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const cachedUser = session.readCachedUser<User>()
  const hasTokens = session.hasTokens()
  let hydration: Promise<void> | null = null

  const applySession = (apiSession: ApiSession): User => {
    const user = toClientUser(apiSession.user)
    session.setTokens({ accessToken: apiSession.token, refreshToken: apiSession.refreshToken })
    session.cacheUser(user)
    set({ user, status: 'authenticated' })
    return user
  }

  return {
    user: hasTokens ? cachedUser : null,
    status: hasTokens ? 'checking' : 'anonymous',

    hydrate: () => {
      // Concurrent callers (StrictMode, several guards) share one /auth/me request.
      if (hydration) return hydration
      hydration = (async () => {
        if (!session.hasTokens()) {
          set({ user: null, status: 'anonymous' })
          return
        }
        try {
          const user = toClientUser(await authApi.me())
          session.cacheUser(user)
          set({ user, status: 'authenticated' })
        } catch (error) {
          if (isApiError(error) && (error.status === 401 || error.status === 403)) {
            session.clear()
            set({ user: null, status: 'anonymous' })
            return
          }
          // Server unreachable: keep the cached user visible rather than logging them out.
          set({ status: get().user ? 'authenticated' : 'anonymous' })
        }
      })().finally(() => {
        hydration = null
      })
      return hydration
    },

    login: async (email, password) => applySession(await authApi.login({ email, password })),

    register: async (name, email, password) => {
      await authApi.register({ name, email, password })
      return get().login(email, password)
    },

    logout: async () => {
      try {
        if (session.getAccessToken()) await authApi.logout()
      } catch {
        // The server may already consider this session gone; clear locally either way.
      } finally {
        session.clear()
        set({ user: null, status: 'anonymous' })
      }
    },

    updateName: async (name) => {
      const user = toClientUser(await authApi.updateName(name))
      session.cacheUser(user)
      set({ user })
      return user
    },

    clearSession: () => {
      session.clear()
      set({ user: null, status: 'anonymous' })
    },
  }
})

setSessionExpiredHandler(() => useAuthStore.getState().clearSession())
