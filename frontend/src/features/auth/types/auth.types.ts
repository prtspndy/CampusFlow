export type BackendUserRole = 'member' | 'volunteer' | 'door_staff' | 'treasurer' | 'admin'
export type AccountStatus = 'active' | 'disabled'

export interface PublicUser {
  id: string
  email: string
  name: string
  role: BackendUserRole
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RefreshInput {
  refreshToken: string
}

export interface UpdateProfileInput {
  name: string
}

export interface AuthSession {
  token: string
  refreshToken: string
  expiresIn: number
  user: PublicUser
}

export interface LoginCredentials {
  email: string
  password?: string
  role?: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  user: PublicUser
}
