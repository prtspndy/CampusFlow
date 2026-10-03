export const USER_ROLES = ['member', 'volunteer', 'door_staff', 'treasurer', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['active', 'disabled'] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Platform permissions across Phase 01 (Auth) and Phase 02 (Memberships & Events).
 */
export const ROLE_PERMISSIONS = {
  member: [
    'profile:read',
    'profile:update',
    'membership:apply',
    'membership:read:own',
    'membership:renew:own',
    'events:read:published',
  ],
  volunteer: [
    'profile:read',
    'profile:update',
    'membership:apply',
    'membership:read:own',
    'membership:renew:own',
    'events:read:published',
    'events:create',
  ],
  door_staff: [
    'profile:read',
    'profile:update',
    'membership:apply',
    'membership:read:own',
    'membership:renew:own',
    'events:read:published',
    'events:create',
    'events:read:drafts',
  ],
  treasurer: [
    'profile:read',
    'profile:update',
    'membership:apply',
    'membership:read:own',
    'membership:renew:own',
    'membership:read:any',
    'membership:manage',
    'events:read:published',
    'events:create',
    'events:read:drafts',
    'events:manage:any',
  ],
  admin: [
    'profile:read',
    'profile:update',
    'users:read:any',
    'users:list',
    'membership:apply',
    'membership:read:own',
    'membership:renew:own',
    'membership:read:any',
    'membership:manage',
    'events:read:published',
    'events:create',
    'events:read:drafts',
    'events:manage:any',
  ],
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
