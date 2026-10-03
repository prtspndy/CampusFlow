import type { User, Role } from '@/types'

export interface LoginCredentials {
  email: string
  role?: Role
}

export interface AuthResponse {
  token: string
  user: User
}
