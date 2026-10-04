import { describe, it, expect } from 'vitest';
import {
  hasRole,
  hasPermission,
  canManageEvents,
  canManageTreasury,
  canCheckIn,
  canManageVolunteers,
  canManageFundraisers,
  canReviewExpenses,
} from '../config/permissions';
import { User } from '../types/auth';

const createMockUser = (role: 'ADMIN' | 'MEMBER' | 'EVENT_MANAGER' | 'TREASURER', permissions: string[] = []): User => ({
  id: 'usr_123',
  email: `${role.toLowerCase()}@campus.edu`,
  name: `Test ${role}`,
  role,
  roleDisplayName: role,
  permissions,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('permissions', () => {
  const admin = createMockUser('ADMIN');
  const eventManager = createMockUser('EVENT_MANAGER', ['events:create', 'events:edit']);
  const treasurer = createMockUser('TREASURER', ['finance:view', 'expenses:approve']);
  const member = createMockUser('MEMBER');

  describe('hasRole', () => {
    it('returns false for unauthenticated user (null)', () => {
      expect(hasRole(null, 'ADMIN')).toBe(false);
      expect(hasRole(null, ['ADMIN', 'MEMBER'])).toBe(false);
    });

    it('matches single role correctly', () => {
      expect(hasRole(admin, 'ADMIN')).toBe(true);
      expect(hasRole(admin, 'MEMBER')).toBe(false);
      expect(hasRole(eventManager, 'EVENT_MANAGER')).toBe(true);
      expect(hasRole(treasurer, 'TREASURER')).toBe(true);
    });

    it('matches array of roles correctly', () => {
      expect(hasRole(treasurer, ['ADMIN', 'TREASURER'])).toBe(true);
      expect(hasRole(member, ['ADMIN', 'TREASURER'])).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('grants all permissions unconditionally to ADMIN', () => {
      expect(hasPermission(admin, 'any:arbitrary:perm')).toBe(true);
      expect(hasPermission(admin, 'danger:destroy:all')).toBe(true);
    });

    it('grants permissions explicitly held by user', () => {
      expect(hasPermission(eventManager, 'events:create')).toBe(true);
      expect(hasPermission(treasurer, 'finance:view')).toBe(true);
    });

    it('denies permissions not explicitly held', () => {
      expect(hasPermission(eventManager, 'finance:settle')).toBe(false);
      expect(hasPermission(member, 'events:create')).toBe(false);
      expect(hasPermission(null, 'events:create')).toBe(false);
    });
  });

  describe('role helper guards', () => {
    it('canManageEvents allows ADMIN and EVENT_MANAGER', () => {
      expect(canManageEvents(admin)).toBe(true);
      expect(canManageEvents(eventManager)).toBe(true);
      expect(canManageEvents(treasurer)).toBe(false);
      expect(canManageEvents(member)).toBe(false);
      expect(canManageEvents(null)).toBe(false);
    });

    it('canManageTreasury allows ADMIN and TREASURER', () => {
      expect(canManageTreasury(admin)).toBe(true);
      expect(canManageTreasury(treasurer)).toBe(true);
      expect(canManageTreasury(eventManager)).toBe(false);
      expect(canManageTreasury(member)).toBe(false);
    });

    it('canCheckIn allows ADMIN and EVENT_MANAGER', () => {
      expect(canCheckIn(admin)).toBe(true);
      expect(canCheckIn(eventManager)).toBe(true);
      expect(canCheckIn(treasurer)).toBe(false);
      expect(canCheckIn(member)).toBe(false);
    });

    it('canManageVolunteers allows ADMIN and EVENT_MANAGER', () => {
      expect(canManageVolunteers(admin)).toBe(true);
      expect(canManageVolunteers(eventManager)).toBe(true);
      expect(canManageVolunteers(treasurer)).toBe(false);
    });

    it('canManageFundraisers allows ADMIN, EVENT_MANAGER, and TREASURER', () => {
      expect(canManageFundraisers(admin)).toBe(true);
      expect(canManageFundraisers(eventManager)).toBe(true);
      expect(canManageFundraisers(treasurer)).toBe(true);
      expect(canManageFundraisers(member)).toBe(false);
    });

    it('canReviewExpenses allows ADMIN and TREASURER', () => {
      expect(canReviewExpenses(admin)).toBe(true);
      expect(canReviewExpenses(treasurer)).toBe(true);
      expect(canReviewExpenses(eventManager)).toBe(false);
      expect(canReviewExpenses(member)).toBe(false);
    });
  });
});
