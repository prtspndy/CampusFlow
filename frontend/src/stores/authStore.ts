import { create } from 'zustand'
import type { User } from '../types/models'
import { ROLES, type UserRole } from '../lib/constants'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  switchRole: (role: UserRole) => void
}

const DEMO_USERS: Record<UserRole, User> = {
  [ROLES.MEMBER]: {
    id: 'user-member-1',
    name: 'Aanya Patel',
    email: 'aanya.patel@skyline.edu',
    studentId: 'SKY-2024-8831',
    role: ROLES.MEMBER,
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
  },
  [ROLES.TREASURER]: {
    id: 'user-treasurer-1',
    name: 'Devon Lee',
    email: 'treasurer@skyline.edu',
    role: ROLES.TREASURER,
  },
  [ROLES.ADMIN]: {
    id: 'user-admin-1',
    name: 'Elena Rostova',
    email: 'president@skyline.edu',
    role: ROLES.ADMIN,
  },
}

const STORAGE_TOKEN_KEY = 'campusflow_token'
const STORAGE_USER_KEY = 'campusflow_user'

export const useAuthStore = create<AuthState>((set) => {
  let initialToken: string | null = null
  let initialUser: User | null = null

  if (typeof window !== 'undefined') {
    initialToken = localStorage.getItem(STORAGE_TOKEN_KEY)
    const storedUser = localStorage.getItem(STORAGE_USER_KEY)
    if (storedUser) {
      try {
        initialUser = JSON.parse(storedUser)
      } catch {
        initialUser = null
      }
    }

    // Default to Member demo user if nothing stored to facilitate instant preview
    if (!initialUser) {
      initialUser = DEMO_USERS[ROLES.MEMBER]
      initialToken = 'demo-jwt-token-campusflow'
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialUser,
    login: (user, token) => {
      localStorage.setItem(STORAGE_TOKEN_KEY, token)
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
      set({ user, token, isAuthenticated: true })
    },
    logout: () => {
      localStorage.removeItem(STORAGE_TOKEN_KEY)
      localStorage.removeItem(STORAGE_USER_KEY)
      set({ user: null, token: null, isAuthenticated: false })
    },
    switchRole: (role: UserRole) => {
      const demoUser = DEMO_USERS[role]
      const token = `demo-token-${role.toLowerCase()}`
      localStorage.setItem(STORAGE_TOKEN_KEY, token)
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser))
      set({ user: demoUser, token, isAuthenticated: true })
    },
  }
})
