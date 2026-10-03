import {
  AccountStatus,
  normalizeRole,
  PublicUser,
  ROLE_DISPLAY_NAMES,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types/auth.js';

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const role = normalizeRole(user.role);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    roleDisplayName: ROLE_DISPLAY_NAMES[role] ?? role,
    permissions: [...(ROLE_PERMISSIONS[role] ?? [])],
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
