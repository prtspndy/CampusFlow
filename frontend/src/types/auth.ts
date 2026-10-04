export const UserRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  EVENT_MANAGER: 'EVENT_MANAGER',
  TREASURER: 'TREASURER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type AccountStatus = 'active' | 'disabled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleDisplayName: string;
  permissions: string[];
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name: string;
}
