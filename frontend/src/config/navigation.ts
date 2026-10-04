import {
  LayoutDashboard,
  Calendar,
  Ticket,
  QrCode,
  Users,
  Megaphone,
  HeartHandshake,
  DollarSign,
  ShoppingBag,
  PackageCheck,
  Receipt,
  Landmark,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { User } from '../types/auth';
import { canCheckIn, canManageTreasury, hasRole } from './permissions';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  section: 'OVERVIEW' | 'OPERATIONS' | 'GOVERNANCE';
}

export function getNavigationItems(user: User | null): NavItem[] {
  if (!user) {
    return [
      { name: 'Overview', href: '/', icon: LayoutDashboard, section: 'OVERVIEW' },
      { name: 'Events & Gala Tickets', href: '/events', icon: Calendar, section: 'OPERATIONS' },
      { name: 'Merch & Store', href: '/store', icon: ShoppingBag, section: 'OPERATIONS' },
      { name: 'Volunteer Shifts', href: '/volunteers', icon: HeartHandshake, section: 'OPERATIONS' },
      { name: 'Fundraisers', href: '/fundraisers', icon: DollarSign, section: 'OPERATIONS' },
      { name: 'Announcements', href: '/announcements', icon: Megaphone, section: 'GOVERNANCE' },
    ];
  }

  const items: NavItem[] = [
    {
      name: user.role === 'MEMBER' ? 'Student Portal' : 'Executive Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      section: 'OVERVIEW',
    },
    { name: 'Members & Dues', href: '/memberships', icon: Users, section: 'OPERATIONS' },
    { name: 'Events & Gala Tickets', href: '/events', icon: Calendar, section: 'OPERATIONS' },
    { name: 'My Tickets', href: '/tickets', icon: Ticket, section: 'OPERATIONS' },
  ];

  if (canCheckIn(user)) {
    items.push({ name: 'Ticket Check-in', href: '/checkin', icon: QrCode, section: 'OPERATIONS' });
  }

  items.push(
    { name: 'Merch & Hoodies', href: '/store', icon: ShoppingBag, section: 'OPERATIONS' },
    { name: 'Orders', href: '/orders', icon: PackageCheck, section: 'OPERATIONS' },
    { name: 'Fundraisers & Tasks', href: '/fundraisers', icon: DollarSign, section: 'OPERATIONS' },
    { name: 'Volunteer Shifts', href: '/volunteers', icon: HeartHandshake, section: 'OPERATIONS' },
  );

  // Governance section
  items.push(
    { name: 'Announcements', href: '/announcements', icon: Megaphone, section: 'GOVERNANCE' },
    { name: 'Expenses & Claims', href: '/expenses', icon: Receipt, section: 'GOVERNANCE' },
  );

  if (canManageTreasury(user)) {
    items.push({ name: 'Treasurer Ledger', href: '/treasury', icon: Landmark, section: 'GOVERNANCE' });
  }

  if (hasRole(user, 'ADMIN')) {
    items.push({ name: 'User Governance & RBAC', href: '/admin/users', icon: ShieldCheck, section: 'GOVERNANCE' });
  }

  return items;
}
