export type ModuleType =
  | 'members'
  | 'events'
  | 'announcements'
  | 'shop'
  | 'tasks'
  | 'treasury'

export interface ModuleConfig {
  id: ModuleType
  name: string
  label: string
  bgVar: string
  textVar: string
  iconName: string
  path: string
  description: string
}

export const MODULES: Record<ModuleType, ModuleConfig> = {
  members: {
    id: 'members',
    name: 'Members',
    label: 'Membership',
    bgVar: 'var(--color-tint-sky)',
    textVar: 'var(--color-tint-sky-deep)',
    iconName: 'Users',
    path: '/admin/members',
    description: 'Member directory, pass status, and renewal tracking',
  },
  events: {
    id: 'events',
    name: 'Events',
    label: 'Events & Tickets',
    bgVar: 'var(--color-tint-peach)',
    textVar: 'var(--color-tint-peach-deep)',
    iconName: 'Calendar',
    path: '/admin/events',
    description: 'Upcoming schedules, ticket registrations, and door check-in',
  },
  announcements: {
    id: 'announcements',
    name: 'Announcements',
    label: 'Announcements',
    bgVar: 'var(--color-tint-lavender)',
    textVar: 'var(--color-tint-lavender-deep)',
    iconName: 'Megaphone',
    path: '/admin/announcements',
    description: 'Targeted broadcasts to members, volunteers, and attendees',
  },
  shop: {
    id: 'shop',
    name: 'Shop',
    label: 'Merchandise',
    bgVar: 'var(--color-tint-mint)',
    textVar: 'var(--color-tint-mint-deep)',
    iconName: 'ShoppingBag',
    path: '/admin/shop',
    description: 'Campus merch catalog, size inventory, and orders',
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    label: 'Tasks & Fundraisers',
    bgVar: 'var(--color-tint-butter)',
    textVar: 'var(--color-tint-butter-deep)',
    iconName: 'CheckSquare',
    path: '/admin/fundraisers',
    description: 'Fundraiser campaign goals and volunteer task boards',
  },
  treasury: {
    id: 'treasury',
    name: 'Treasury',
    label: 'Treasury & Finance',
    bgVar: 'var(--color-tint-sage)',
    textVar: 'var(--color-tint-sage-deep)',
    iconName: 'Landmark',
    path: '/admin/treasury',
    description: 'Ledger cash flow, dues, and reimbursement requests',
  },
}

export const APP_NAME = 'CampusFlow'
export const ORG_NAME = 'Skyline Student Association'

export const ROLES = {
  MEMBER: 'MEMBER',
  VOLUNTEER: 'VOLUNTEER',
  DOOR_STAFF: 'DOOR_STAFF',
  TREASURER: 'TREASURER',
  ADMIN: 'ADMIN',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/** Roles that may open the admin console. Mirrors the sidebar's section rules. */
export const ADMIN_CONSOLE_ROLES: UserRole[] = [ROLES.ADMIN, ROLES.TREASURER, ROLES.VOLUNTEER]

/** Roles that may run the door check-in scanner. */
export const CHECKIN_ROLES: UserRole[] = [ROLES.ADMIN, ROLES.DOOR_STAFF, ROLES.VOLUNTEER]

export function formatRole(role: UserRole): string {
  return role.toLowerCase().replace('_', ' ')
}
