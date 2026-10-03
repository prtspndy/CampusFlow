import { create } from 'zustand'
import type { User } from '../types/models'
import type { UserRole } from '../lib/constants'
import { authApi, type ApiSession, type ApiUser } from '../lib/authApi'
import { isApiError, setSessionExpiredHandler } from '../lib/api'
import { session } from '../lib/session'
import { membershipApiService } from '../features/members/services/membershipService'

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
  fetchMembership: () => Promise<void>
  clearSession: () => void
}

export function toClientUser(apiUser: ApiUser): User {
  const upperRole = apiUser.role.toUpperCase()
  let role: UserRole = 'MEMBER'
  if (upperRole === 'ADMIN') role = 'ADMIN'
  else if (upperRole === 'TREASURER') role = 'TREASURER'
  else if (upperRole === 'EVENT_MANAGER' || upperRole === 'VOLUNTEER' || upperRole === 'DOOR_STAFF')
    role = 'EVENT_MANAGER'
  else role = 'MEMBER'

  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role,
    roleDisplayName: apiUser.roleDisplayName,
    permissions: apiUser.permissions,
    status: apiUser.status,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
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
          try {
            const memberships = await membershipApiService.getOwnMembership()
            if (Array.isArray(memberships) && memberships.length > 0) {
              const active = memberships.find((m) => m.status === 'ACTIVE') ?? memberships[0]
              user.membership = {
                id: active.id,
                userId: active.userId,
                memberCode: active.memberCode,
                status: active.status as any,
                validUntil: active.validUntil,
                planName: active.planName,
                perks: active.perks,
              }
            }
          } catch {
            // Ignore membership load errors during hydration
          }
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

    login: async (email, password) => {
      const u = applySession(await authApi.login({ email, password }))
      void get().fetchMembership()
      return u
    },

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

    fetchMembership: async () => {
      const currentUser = get().user
      if (!currentUser) return
      try {
        const memberships = await membershipApiService.getOwnMembership()
        if (Array.isArray(memberships) && memberships.length > 0) {
          const active = memberships.find((m) => m.status === 'ACTIVE') ?? memberships[0]
          const updatedUser: User = {
            ...currentUser,
            membership: {
              id: active.id,
              userId: active.userId,
              memberCode: active.memberCode,
              status: active.status as any,
              validUntil: active.validUntil,
              planName: active.planName,
              perks: active.perks,
            },
          }
          session.cacheUser(updatedUser)
          set({ user: updatedUser })
        }
      } catch {
        // Ignored
      }
    },

    clearSession: () => {
      session.clear()
      set({ user: null, status: 'anonymous' })
    },
  }
})

setSessionExpiredHandler(() => useAuthStore.getState().clearSession())
