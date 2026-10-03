import { Event } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedUser, hasPermission } from '../types/auth.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export async function loadManagedEvent(user: AuthenticatedUser, eventId: string): Promise<Event> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  const managesAll = hasPermission(user.role, 'events.manage_all');
  if (managesAll || event.organizerId === user.id) {
    return event;
  }

  throw new ForbiddenError('You do not have permission to manage this event');
}

export function canManageRegistrationEvent(
  user: AuthenticatedUser,
  event: { organizerId: string },
): boolean {
  return hasPermission(user.role, 'events.manage_all') || event.organizerId === user.id;
}
