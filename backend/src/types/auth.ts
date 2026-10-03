export const USER_ROLES = ['ADMIN', 'MEMBER', 'EVENT_MANAGER', 'TREASURER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['active', 'disabled'] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  ADMIN: 'Admin / Organization President',
  MEMBER: 'Club Member / Student',
  EVENT_MANAGER: 'Event Manager / Volunteer',
  TREASURER: 'Treasurer',
};

/**
 * Granular permissions matrix for CampusFlow four-role RBAC.
 */
export const ROLE_PERMISSIONS = {
  MEMBER: [
    'profile.read_own',
    'profile.update_own',
    'organization.read',
    'memberships.read_own',
    'memberships.purchase',
    'memberships.renew_own',
    'events.read',
    'tickets.read_own',
    'announcements.read',
    'merchandise.read',
    'orders.create',
    'orders.read_own',
    'fundraisers.read',
    'fundraisers.contribute',
    'volunteers.read',
    'volunteers.signup',
    'finance.expenses.create',
    'finance.expenses.read_own',
    'reimbursements.read_own',
  ],
  EVENT_MANAGER: [
    'profile.read_own',
    'profile.update_own',
    'organization.read',
    'memberships.read_own',
    'memberships.purchase',
    'memberships.renew_own',
    'events.read',
    'events.read_drafts',
    'events.create',
    'events.update',
    'events.delete',
    'events.registrations.read',
    'events.registrations.manage',
    'tickets.read_own',
    'tickets.validate',
    'attendance.read',
    'attendance.manage',
    'announcements.read',
    'announcements.create',
    'merchandise.read',
    'orders.create',
    'orders.read_own',
    'fundraisers.read',
    'fundraisers.contribute',
    'fundraisers.manage',
    'volunteers.read',
    'volunteers.signup',
    'volunteers.manage',
    'finance.expenses.create',
    'finance.expenses.read_own',
    'reimbursements.read_own',
  ],
  TREASURER: [
    'profile.read_own',
    'profile.update_own',
    'organization.read',
    'memberships.read',
    'memberships.read_own',
    'memberships.purchase',
    'memberships.renew_own',
    'events.read',
    'tickets.read_own',
    'announcements.read',
    'merchandise.read',
    'orders.create',
    'orders.read_own',
    'orders.read_all',
    'payments.read',
    'finance.read',
    'finance.expenses.create',
    'finance.expenses.read_own',
    'finance.expenses.manage',
    'reimbursements.read_own',
    'reimbursements.read',
    'reimbursements.review',
    'reimbursements.settle',
    'reports.finance.read',
    'reports.finance.export',
    'fundraisers.read',
    'fundraisers.contribute',
    'fundraisers.manage',
    'volunteers.read',
    'volunteers.signup',
  ],
  ADMIN: [
    'profile.read_own',
    'profile.update_own',
    'organization.read',
    'organization.update',
    'users.read',
    'users.manage',
    'users.assign_roles',
    'memberships.read',
    'memberships.read_own',
    'memberships.purchase',
    'memberships.renew_own',
    'memberships.manage',
    'events.read',
    'events.read_drafts',
    'events.create',
    'events.update',
    'events.delete',
    'events.manage_all',
    'events.registrations.read',
    'events.registrations.manage',
    'tickets.read_own',
    'tickets.validate',
    'attendance.read',
    'attendance.manage',
    'announcements.read',
    'announcements.create',
    'announcements.publish',
    'merchandise.read',
    'merchandise.manage',
    'orders.create',
    'orders.read_own',
    'orders.read_all',
    'payments.read',
    'finance.read',
    'finance.expenses.create',
    'finance.expenses.read_own',
    'finance.expenses.manage',
    'reimbursements.read_own',
    'reimbursements.read',
    'reimbursements.review',
    'reimbursements.settle',
    'reports.finance.read',
    'reports.finance.export',
    'fundraisers.read',
    'fundraisers.contribute',
    'fundraisers.manage',
    'volunteers.read',
    'volunteers.signup',
    'volunteers.manage',
  ],
} as const satisfies Record<UserRole, readonly string[]>;

export type Permission = (typeof ROLE_PERMISSIONS)[UserRole][number];

/**
 * Mapping legacy colon-separated permission tokens to canonical dot-notation permissions
 * for seamless backwards compatibility.
 */
export const PERMISSION_ALIASES: Record<string, Permission> = {
  'profile:read': 'profile.read_own',
  'profile:update': 'profile.update_own',
  'users:read:any': 'users.read',
  'users:list': 'users.read',
  'membership:apply': 'memberships.purchase',
  'membership:read:own': 'memberships.read_own',
  'membership:renew:own': 'memberships.renew_own',
  'membership:read:any': 'memberships.read',
  'membership:manage': 'memberships.manage',
  'events:read:published': 'events.read',
  'events:create': 'events.create',
  'events:read:drafts': 'events.read_drafts',
  'events:manage:any': 'events.manage_all',
};

export function normalizeRole(role: UserRole | string | undefined | null): UserRole {
  if (!role) return 'MEMBER';
  const upper = String(role).toUpperCase();
  if (upper === 'ADMIN') return 'ADMIN';
  if (upper === 'MEMBER') return 'MEMBER';
  if (
    upper === 'EVENT_MANAGER' ||
    upper === 'VOLUNTEER' ||
    upper === 'DOOR_STAFF' ||
    upper === 'STAFF'
  ) {
    return 'EVENT_MANAGER';
  }
  if (upper === 'TREASURER') return 'TREASURER';
  return 'MEMBER';
}

export function hasPermission(
  role: UserRole | string | undefined | null,
  permission: Permission | string,
): boolean {
  const normalized = normalizeRole(role);
  const perms = (ROLE_PERMISSIONS[normalized] ?? []) as readonly string[];
  if (perms.includes(permission)) {
    return true;
  }
  const canonical = PERMISSION_ALIASES[permission];
  return canonical ? perms.includes(canonical) : false;
}

export interface PublicUser {
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
