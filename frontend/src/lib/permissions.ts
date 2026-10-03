import type { User } from '../types/models'
import type { UserRole } from './constants'
import { ROLES } from './constants'

/**
 * Frontend permissions matrix mirror for client-side evaluation and offline fallback.
 * The server is always authoritative and issues the live permissions array on the user session.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
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
}

/**
 * Backward compatibility aliases between colon-separated Phase 01/02 tokens and canonical dot notation.
 */
export const PERMISSION_ALIASES: Record<string, string> = {
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
}

export function getUserPermissions(user: User | null | undefined): string[] {
  if (!user) return []
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions
  }
  const fallback = ROLE_PERMISSIONS[user.role] ?? []
  return [...fallback]
}

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  const permissions = getUserPermissions(user)
  if (permissions.includes(permission)) return true
  const canonical = PERMISSION_ALIASES[permission]
  return canonical ? permissions.includes(canonical) : false
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false
  return permissions.some((perm) => hasPermission(user, perm))
}

export function hasAllPermissions(user: User | null | undefined, permissions: string[]): boolean {
  if (!user) return false
  return permissions.every((perm) => hasPermission(user, perm))
}

export const can = hasPermission
