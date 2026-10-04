import { describe, it, expect } from 'vitest';
import { getNavigationItems } from '../config/navigation';
import { User } from '../types/auth';

const createMockUser = (role: 'ADMIN' | 'MEMBER' | 'EVENT_MANAGER' | 'TREASURER'): User => ({
  id: 'usr_test',
  email: `${role.toLowerCase()}@campus.edu`,
  name: `Test ${role}`,
  role,
  roleDisplayName: role,
  permissions: [],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('getNavigationItems', () => {
  it('returns public navigation links for guest (null user)', () => {
    const items = getNavigationItems(null);
    const routes = items.map((i) => i.href);

    expect(routes).toContain('/');
    expect(routes).toContain('/events');
    expect(routes).toContain('/store');
    expect(routes).toContain('/announcements');
    expect(routes).not.toContain('/dashboard');
    expect(routes).not.toContain('/admin/users');
    expect(routes).not.toContain('/treasury');
    expect(routes).not.toContain('/checkin');
  });

  it('includes member items and excludes staff-only items for regular MEMBER', () => {
    const member = createMockUser('MEMBER');
    const items = getNavigationItems(member);
    const routes = items.map((i) => i.href);

    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/events');
    expect(routes).toContain('/tickets');
    expect(routes).toContain('/memberships');
    expect(routes).toContain('/store');
    expect(routes).toContain('/orders');
    expect(routes).toContain('/expenses');

    // Should not include staff routes
    expect(routes).not.toContain('/checkin');
    expect(routes).not.toContain('/treasury');
    expect(routes).not.toContain('/admin/users');
  });

  it('includes check-in scanner for EVENT_MANAGER', () => {
    const eventManager = createMockUser('EVENT_MANAGER');
    const items = getNavigationItems(eventManager);
    const routes = items.map((i) => i.href);

    expect(routes).toContain('/checkin');
    expect(routes).not.toContain('/treasury');
    expect(routes).not.toContain('/admin/users');
  });

  it('includes treasury ledger for TREASURER', () => {
    const treasurer = createMockUser('TREASURER');
    const items = getNavigationItems(treasurer);
    const routes = items.map((i) => i.href);

    expect(routes).toContain('/treasury');
    expect(routes).not.toContain('/checkin');
    expect(routes).not.toContain('/admin/users');
  });

  it('includes all administrative tools for ADMIN', () => {
    const admin = createMockUser('ADMIN');
    const items = getNavigationItems(admin);
    const routes = items.map((i) => i.href);

    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/checkin');
    expect(routes).toContain('/treasury');
    expect(routes).toContain('/admin/users');
  });
});
