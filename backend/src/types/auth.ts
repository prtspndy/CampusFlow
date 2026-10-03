export const USER_ROLES = ['member', 'volunteer', 'door_staff', 'treasurer', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['active', 'disabled'] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Phase 01 platform permissions.
 * Club ownership and event permissions are intentionally absent until later phases.
 */
export const ROLE_PERMISSIONS = {
  member: ['profile:read', 'profile:update'],
  volunteer: ['profile:read', 'profile:update'],
  door_staff: ['profile:read', 'profile:update'],
  treasurer: ['profile:read', 'profile:update'],
  admin: ['profile:read', 'profile:update', 'users:read:any', 'users:list'],
} as const satisfies Record<UserRole, readonly string[]>;

export type Permission = (typeof ROLE_PERMISSIONS)[UserRole][number];

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  tokenVersion: number;
}
