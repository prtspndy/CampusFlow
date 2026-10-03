import { api } from './api'

/** Shapes returned by the backend. See docs/API_CONTRACT.md §5. */
export type ApiRole = 'member' | 'volunteer' | 'door_staff' | 'treasurer' | 'admin'

export interface ApiUser {
  id: string
  email: string
  name: string
  role: ApiRole
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}

export interface ApiSession {
  token: string
  refreshToken: string
  expiresIn: number
  user: ApiUser
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

export const authApi = {
  register: (input: RegisterInput) => api.post<ApiUser>('/auth/register', input, { auth: false }),
  login: (input: LoginInput) => api.post<ApiSession>('/auth/login', input, { auth: false }),
  logout: () => api.post<null>('/auth/logout'),
  me: () => api.get<ApiUser>('/auth/me'),
  updateName: (name: string) => api.patch<ApiUser>('/auth/me', { name }),
}
