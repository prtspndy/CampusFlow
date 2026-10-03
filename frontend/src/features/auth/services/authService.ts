import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/services/endpoints'
import type {
  AuthSession,
  LoginInput,
  PublicUser,
  RegisterInput,
  UpdateProfileInput,
} from '../types/auth.types'

export const authService = {
  /**
   * Public user registration. Always creates role 'member'.
   */
  async register(input: RegisterInput): Promise<PublicUser> {
    return api.post<PublicUser>(API_ENDPOINTS.AUTH.REGISTER, input, { skipAuth: true })
  },

  /**
   * User login. Returns JWT access token, opaque refresh token, and user profile.
   */
  async login(input: LoginInput): Promise<AuthSession> {
    return api.post<AuthSession>(API_ENDPOINTS.AUTH.LOGIN, input, { skipAuth: true })
  },

  /**
   * Refresh session using opaque refresh token.
   */
  async refresh(refreshToken: string): Promise<AuthSession> {
    return api.post<AuthSession>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, { skipAuth: true })
  },

  /**
   * Server-side logout revoking token version and refresh tokens.
   */
  async logout(): Promise<void> {
    try {
      await api.post<void>(API_ENDPOINTS.AUTH.LOGOUT)
    } finally {
      api.clearTokens()
    }
  },

  /**
   * Retrieve current authenticated user profile.
   */
  async getMe(): Promise<PublicUser> {
    return api.get<PublicUser>(API_ENDPOINTS.AUTH.ME)
  },

  /**
   * Update authenticated user's own display name.
   */
  async updateMe(input: UpdateProfileInput): Promise<PublicUser> {
    return api.patch<PublicUser>(API_ENDPOINTS.AUTH.ME, input)
  },

  /**
   * Retrieve a user profile by ID (caller must be self or admin).
   */
  async getUserById(userId: string): Promise<PublicUser> {
    return api.get<PublicUser>(API_ENDPOINTS.USERS.BY_ID(userId))
  },

  /**
   * Admin-only: list all platform users (max 100).
   */
  async listAdminUsers(): Promise<{ users: PublicUser[] }> {
    return api.get<{ users: PublicUser[] }>(API_ENDPOINTS.ADMIN.USERS)
  },
}
