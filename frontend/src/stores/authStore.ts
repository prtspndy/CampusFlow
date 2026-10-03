import { create } from 'zustand'
import type { User } from '../types/models'
import { ROLES, type UserRole } from '../lib/constants'
import { api, STORAGE_KEYS } from '../lib/api'
import { authService } from '../features/auth/services/authService'
import type { AuthSession, LoginInput, PublicUser, RegisterInput } from '../features/auth/types/auth.types'

export function normalizeRole(role: string | undefined): UserRole {
  if (!role) return ROLES.MEMBER
  const upper = role.toUpperCase()
  if (upper in ROLES) {
    return upper as UserRole
  }
  // Fallbacks for variations
  if (upper === 'STUDENT') return ROLES.MEMBER
  return ROLES.MEMBER
}

export function toAppUser(publicUser: PublicUser): User {
  const normRole = normalizeRole(publicUser.role)
  return {
    id: publicUser.id,
    name: publicUser.name,
    email: publicUser.email,
    role: normRole,
    studentId: `CF-${publicUser.id.substring(0, 8).toUpperCase()}`,
    status: publicUser.status,
    membership: {
      id: `mem-${publicUser.id.substring(0, 6)}`,
      userId: publicUser.id,
      memberCode: `CF-${publicUser.id.substring(0, 4).toUpperCase()}-2026`,
      status: publicUser.status === 'active' ? 'ACTIVE' : 'EXPIRED',
      validUntil: '2026-12-31T23:59:59Z',
      planName: normRole === ROLES.ADMIN ? 'Executive Leadership' : 'Annual Gold Member',
      perks: ['Member ticket prices', '15% Merch discount', 'Priority RSVP'],
    },
  }
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  isLoading: boolean
  isDemoMode: boolean
  error: string | null

  // Real backend operations
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
  updateProfileName: (newName: string) => Promise<User>
  fetchCurrentUser: () => Promise<User | null>
  initialize: () => Promise<void>

  // Quick demo role switcher for judges and preview
  switchRole: (role: UserRole) => void
  clearError: () => void
}

const DEMO_USERS: Record<UserRole, User> = {
  [ROLES.MEMBER]: {
    id: 'user-member-1',
    name: 'Aanya Patel',
    email: 'aanya.patel@skyline.edu',
    studentId: 'SKY-2024-8831',
    role: ROLES.MEMBER,
    status: 'active',
    membership: {
      id: 'mem-101',
      userId: 'user-member-1',
      memberCode: 'CF-8831-2026',
      status: 'ACTIVE',
      validUntil: '2026-12-31T23:59:59Z',
      planName: 'Annual Gold Member',
      perks: ['Member ticket prices', '15% Merch discount', 'Priority RSVP'],
    },
  },
  [ROLES.VOLUNTEER]: {
    id: 'user-vol-1',
    name: 'Marcus Vance',
    email: 'marcus.v@skyline.edu',
    studentId: 'SKY-2024-5219',
    role: ROLES.VOLUNTEER,
    status: 'active',
    membership: {
      id: 'mem-102',
      userId: 'user-vol-1',
      memberCode: 'CF-5219-2026',
      status: 'ACTIVE',
      validUntil: '2026-12-31T23:59:59Z',
      planName: 'Volunteer Crew',
      perks: ['Staff t-shirt', 'Event access', 'Service hours credits'],
    },
  },
  [ROLES.DOOR_STAFF]: {
    id: 'user-door-1',
    name: 'Priya Sharma',
    email: 'priya.s@skyline.edu',
    role: ROLES.DOOR_STAFF,
    status: 'active',
  },
  [ROLES.TREASURER]: {
    id: 'user-treasurer-1',
    name: 'Devon Lee',
    email: 'treasurer@skyline.edu',
    role: ROLES.TREASURER,
    status: 'active',
  },
  [ROLES.ADMIN]: {
    id: 'user-admin-1',
    name: 'Elena Rostova',
    email: 'president@skyline.edu',
    role: ROLES.ADMIN,
    status: 'active',
  },
}

export const useAuthStore = create<AuthState>((set, get) => {
  let initialToken: string | null = null
  let initialRefreshToken: string | null = null
  let initialUser: User | null = null
  let isDemo = false

  if (typeof window !== 'undefined') {
    initialToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    initialRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    if (storedUser) {
      try {
        initialUser = JSON.parse(storedUser)
      } catch {
        initialUser = null
      }
    }

    // Default to Member demo user if nothing stored to facilitate instant preview
    if (!initialUser && !initialToken) {
      initialUser = DEMO_USERS[ROLES.MEMBER]
      initialToken = 'demo-jwt-token-campusflow'
      isDemo = true
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    refreshToken: initialRefreshToken,
    isAuthenticated: !!initialUser,
    isInitialized: false,
    isLoading: false,
    isDemoMode: isDemo,
    error: null,

    clearError: () => set({ error: null }),

    /**
     * Initializes authentication state by verifying stored tokens against the backend.
     */
    initialize: async () => {
      const token = api.getAccessToken()
      if (!token || token.startsWith('demo-')) {
        set({ isInitialized: true })
        return
      }

      set({ isLoading: true })
      try {
        const publicUser = await authService.getMe()
        const appUser = toAppUser(publicUser)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(appUser))
        set({
          user: appUser,
          token,
          refreshToken: api.getRefreshToken(),
          isAuthenticated: true,
          isInitialized: true,
          isDemoMode: false,
          isLoading: false,
        })
      } catch {
        // If token verification fails and cannot refresh, fall back to unauthenticated or stored user
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA)
        if (storedUser) {
          try {
            set({ user: JSON.parse(storedUser), isInitialized: true, isLoading: false })
            return
          } catch {
            // parse error
          }
        }
        api.clearTokens()
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        })
      }
    },

    /**
     * Authenticates with email and password via POST /api/auth/login.
     */
    login: async (input: LoginInput): Promise<User> => {
      set({ isLoading: true, error: null })
      try {
        const session: AuthSession = await authService.login(input)
        api.setTokens(session.token, session.refreshToken)

        const appUser = toAppUser(session.user)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(appUser))

        set({
          user: appUser,
          token: session.token,
          refreshToken: session.refreshToken,
          isAuthenticated: true,
          isDemoMode: false,
          isLoading: false,
          error: null,
        })

        return appUser
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid email or password'
        set({ error: msg, isLoading: false })
        throw err
      }
    },

    /**
     * Registers a new user via POST /api/auth/register and automatically signs in.
     */
    register: async (input: RegisterInput): Promise<User> => {
      set({ isLoading: true, error: null })
      try {
        await authService.register(input)
        // Automatically login the newly created user
        return await get().login({ email: input.email, password: input.password })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed'
        set({ error: msg, isLoading: false })
        throw err
      }
    },

    /**
     * Signs out the user via POST /api/auth/logout and clears tokens.
     */
    logout: async () => {
      set({ isLoading: true })
      try {
        if (!get().isDemoMode) {
          await authService.logout()
        }
      } catch {
        // Ignore network errors during logout to ensure clean client state
      } finally {
        api.clearTokens()
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isDemoMode: false,
          isLoading: false,
          error: null,
        })
      }
    },

    /**
     * Updates the current user's display name via PATCH /api/auth/me.
     */
    updateProfileName: async (newName: string): Promise<User> => {
      set({ isLoading: true, error: null })
      try {
        if (get().isDemoMode) {
          const current = get().user
          if (!current) throw new Error('No user is currently active')
          const updated = { ...current, name: newName }
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated))
          set({ user: updated, isLoading: false })
          return updated
        }

        const publicUser = await authService.updateMe({ name: newName })
        const appUser = toAppUser(publicUser)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(appUser))
        set({ user: appUser, isLoading: false })
        return appUser
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile'
        set({ error: msg, isLoading: false })
        throw err
      }
    },

    /**
     * Refetches current user from GET /api/auth/me.
     */
    fetchCurrentUser: async (): Promise<User | null> => {
      if (get().isDemoMode) return get().user
      try {
        const publicUser = await authService.getMe()
        const appUser = toAppUser(publicUser)
        set({ user: appUser, isAuthenticated: true })
        return appUser
      } catch {
        return null
      }
    },

    /**
     * Switches to a designated demo user for preview and judging purposes.
     */
    switchRole: (role: UserRole) => {
      const demoUser = DEMO_USERS[role]
      const token = `demo-token-${role.toLowerCase()}`
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(demoUser))
      set({
        user: demoUser,
        token,
        refreshToken: null,
        isAuthenticated: true,
        isDemoMode: true,
        error: null,
      })
    },
  }
})
