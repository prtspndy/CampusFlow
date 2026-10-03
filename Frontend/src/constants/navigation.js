import { ROLES } from './roles';

export const ROLE_NAVIGATION = {
  [ROLES.SUPER_ADMIN]: [
    {
      category: 'Overview',
      items: [
        { path: '/super-admin/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
      ],
    },
    {
      category: 'Organization',
      items: [
        { path: '/members', label: 'Members', icon: 'bi-people-fill', badge: '1,248' },
        { path: '/membership', label: 'Memberships', icon: 'bi-award-fill' },
        { path: '/events', label: 'Events', icon: 'bi-calendar-event-fill', badge: '5' },
        { path: '/tickets', label: 'Tickets', icon: 'bi-ticket-detailed-fill' },
        { path: '/merchandise', label: 'Merchandise', icon: 'bi-bag-heart-fill' },
        { path: '/volunteers', label: 'Volunteers', icon: 'bi-person-heart' },
      ],
    },
    {
      category: 'Governance & Finance',
      items: [
        { path: '/finance', label: 'Finance', icon: 'bi-cash-coin' },
        { path: '/reports', label: 'Reports', icon: 'bi-file-earmark-bar-graph' },
        { path: '/announcements', label: 'Announcements', icon: 'bi-megaphone-fill' },
      ],
    },
    {
      category: 'System Admin',
      items: [
        { path: '/settings', label: 'Settings', icon: 'bi-gear-wide-connected' },
        { path: '/users', label: 'Users', icon: 'bi-person-badge-fill' },
        { path: '/roles', label: 'Roles', icon: 'bi-shield-lock-fill' },
      ],
    },
  ],

  [ROLES.ADMIN]: [
    {
      category: 'Overview',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
      ],
    },
    {
      category: 'Management',
      items: [
        { path: '/members', label: 'Members', icon: 'bi-people-fill', badge: '1,248' },
        { path: '/events', label: 'Events', icon: 'bi-calendar-event-fill', badge: '5' },
        { path: '/announcements', label: 'Announcements', icon: 'bi-megaphone-fill' },
        { path: '/merchandise', label: 'Merchandise', icon: 'bi-bag-heart-fill' },
        { path: '/reports', label: 'Reports', icon: 'bi-graph-up-arrow' },
      ],
    },
    {
      category: 'Preferences',
      items: [
        { path: '/settings', label: 'Settings', icon: 'bi-gear-wide-connected' },
      ],
    },
  ],

  [ROLES.TREASURER]: [
    {
      category: 'Overview',
      items: [
        { path: '/treasurer/dashboard', label: 'Dashboard', icon: 'bi-wallet2' },
      ],
    },
    {
      category: 'Treasury Operations',
      items: [
        { path: '/finance#income', label: 'Income', icon: 'bi-graph-up-arrow', badge: '+$18.4K' },
        { path: '/finance#expenses', label: 'Expenses', icon: 'bi-graph-down-arrow' },
        { path: '/orders', label: 'Payments', icon: 'bi-credit-card-2-front-fill' },
        { path: '/reports', label: 'Finance Reports', icon: 'bi-file-earmark-spreadsheet-fill' },
      ],
    },
  ],

  [ROLES.EVENT_MANAGER]: [
    {
      category: 'Overview',
      items: [
        { path: '/event-manager/dashboard', label: 'Dashboard', icon: 'bi-calendar3' },
      ],
    },
    {
      category: 'Event Operations',
      items: [
        { path: '/events', label: 'Events', icon: 'bi-calendar-event-fill', badge: '5' },
        { path: '/tickets', label: 'Tickets', icon: 'bi-ticket-perforated-fill' },
        { path: '/attendance', label: 'Attendance', icon: 'bi-qr-code-scan' },
        { path: '/volunteers', label: 'Volunteers', icon: 'bi-person-heart' },
        { path: '/reports', label: 'Reports', icon: 'bi-bar-chart-line-fill' },
      ],
    },
  ],

  [ROLES.VOLUNTEER]: [
    {
      category: 'Overview',
      items: [
        { path: '/volunteer/dashboard', label: 'Dashboard', icon: 'bi-person-workspace' },
      ],
    },
    {
      category: 'My Assignments',
      items: [
        { path: '/tasks', label: 'Assigned Tasks', icon: 'bi-check2-square', badge: '4 Pending' },
        { path: '/events', label: 'Events', icon: 'bi-calendar-check-fill' },
        { path: '/volunteer/dashboard#schedule', label: 'My Schedule', icon: 'bi-clock-history' },
        { path: '/profile', label: 'Profile', icon: 'bi-person-circle' },
      ],
    },
  ],

  [ROLES.MEMBER]: [
    {
      category: 'Overview',
      items: [
        { path: '/member/dashboard', label: 'Dashboard', icon: 'bi-house-door-fill' },
      ],
    },
    {
      category: 'Member Portal',
      items: [
        { path: '/membership', label: 'Membership', icon: 'bi-award-fill' },
        { path: '/events', label: 'Events', icon: 'bi-calendar2-heart' },
        { path: '/tickets', label: 'Buy Tickets', icon: 'bi-ticket-detailed-fill' },
        { path: '/merchandise', label: 'Merchandise', icon: 'bi-bag-check-fill' },
        { path: '/announcements', label: 'Announcements', icon: 'bi-megaphone-fill' },
        { path: '/orders', label: 'My Orders', icon: 'bi-receipt' },
        { path: '/profile', label: 'Profile', icon: 'bi-person-circle' },
      ],
    },
  ],
};

export const getNavItemsForRole = (role) => {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION[ROLES.SUPER_ADMIN];
};

// Fallback legacy export
export const NAV_ITEMS = ROLE_NAVIGATION[ROLES.SUPER_ADMIN];
