import { User, UserRole } from '../types/auth';

export function hasRole(user: User | null, roles: UserRole | UserRole[]): boolean {
  if (!user) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.permissions?.includes(permission) || false;
}

export function canManageEvents(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'EVENT_MANAGER']);
}

export function canManageTreasury(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'TREASURER']);
}

export function canCheckIn(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'EVENT_MANAGER']);
}

export function canManageVolunteers(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'EVENT_MANAGER']);
}

export function canManageFundraisers(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'EVENT_MANAGER', 'TREASURER']);
}

export function canReviewExpenses(user: User | null): boolean {
  return hasRole(user, ['ADMIN', 'TREASURER']);
}
