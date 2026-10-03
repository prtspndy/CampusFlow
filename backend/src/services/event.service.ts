import { Event, EventStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedUser, hasPermission, UserRole } from '../types/auth.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import {
  CreateEventInput,
  ListEventsQuery,
  UpdateEventInput,
} from '../validators/event.validators.js';

export async function createEvent(organizerId: string, input: CreateEventInput): Promise<Event> {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  if (endsAt <= startsAt) {
    throw new BadRequestError('Event endsAt must be strictly after startsAt');
  }

  return prisma.event.create({
    data: {
      organizerId,
      title: input.title,
      description: input.description,
      venue: input.venue,
      category: input.category,
      imageUrl: input.imageUrl,
      startsAt,
      endsAt,
      status: input.status ? (input.status as EventStatus) : EventStatus.DRAFT,
      memberPrice: input.memberPrice ?? 0,
      standardPrice: input.standardPrice ?? 0,
      totalCapacity: input.totalCapacity,
      registeredCount: 0,
      isFeatured: input.isFeatured ?? false,
    },
  });
}

export async function updateEvent(
  eventId: string,
  userOrId: AuthenticatedUser | string,
  roleOrInput: UserRole | UpdateEventInput,
  maybeInput?: UpdateEventInput,
): Promise<Event> {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  const userRole = typeof userOrId === 'string' ? (roleOrInput as UserRole) : userOrId.role;
  const input = typeof userOrId === 'string' ? maybeInput! : (roleOrInput as UpdateEventInput);

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  // Ownership or Admin Check
  const isOrganizer = event.organizerId === userId;
  const canManageAny = hasPermission(userRole, 'events:manage:any');
  if (!isOrganizer && !canManageAny) {
    throw new ForbiddenError('You do not have permission to modify this event');
  }

  // Immutable states: Cancelled or Completed events cannot be edited
  if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
    throw new BadRequestError(`Cannot modify an event with status '${event.status}'`);
  }

  // Validate resulting dates
  const newStartsAt = input.startsAt ? new Date(input.startsAt) : event.startsAt;
  const newEndsAt = input.endsAt ? new Date(input.endsAt) : event.endsAt;

  if (newEndsAt <= newStartsAt) {
    throw new BadRequestError('Event endsAt must be strictly after startsAt');
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.venue !== undefined ? { venue: input.venue } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.startsAt !== undefined ? { startsAt: newStartsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: newEndsAt } : {}),
      ...(input.memberPrice !== undefined ? { memberPrice: input.memberPrice } : {}),
      ...(input.standardPrice !== undefined ? { standardPrice: input.standardPrice } : {}),
      ...(input.totalCapacity !== undefined ? { totalCapacity: input.totalCapacity } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
    },
  });
}

export async function publishEvent(
  eventId: string,
  userOrId: AuthenticatedUser | string,
  maybeRole?: UserRole,
): Promise<Event> {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  const userRole = typeof userOrId === 'string' ? maybeRole! : userOrId.role;

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  // Ownership or Admin Check
  const isOrganizer = event.organizerId === userId;
  const canManageAny = hasPermission(userRole, 'events:manage:any');
  if (!isOrganizer && !canManageAny) {
    throw new ForbiddenError('You do not have permission to publish this event');
  }

  if (event.status === EventStatus.PUBLISHED) {
    throw new BadRequestError('Event is already published');
  }

  if (event.status !== EventStatus.DRAFT) {
    throw new BadRequestError(`Cannot publish an event with status '${event.status}'`);
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.PUBLISHED },
  });
}

export async function cancelEvent(
  eventId: string,
  userOrId: AuthenticatedUser | string,
  maybeRole?: UserRole,
): Promise<Event> {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  const userRole = typeof userOrId === 'string' ? maybeRole! : userOrId.role;

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  // Ownership or Admin Check
  const isOrganizer = event.organizerId === userId;
  const canManageAny = hasPermission(userRole, 'events:manage:any');
  if (!isOrganizer && !canManageAny) {
    throw new ForbiddenError('You do not have permission to cancel this event');
  }

  if (event.status === EventStatus.CANCELLED) {
    throw new BadRequestError('Event is already cancelled');
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.CANCELLED },
  });
}

export async function getEventById(
  eventId: string,
  user?: AuthenticatedUser,
): Promise<Event & { organizer: { id: string; name: string; email: string } }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  // If event is not published, only the organizer or users with events:read:drafts can view it
  if (event.status !== EventStatus.PUBLISHED) {
    const isOrganizer = user && event.organizerId === user.id;
    const canReadDrafts = user && hasPermission(user.role, 'events:read:drafts');

    if (!isOrganizer && !canReadDrafts) {
      // Prevent information disclosure
      throw new NotFoundError('Event not found');
    }
  }

  return event;
}

export async function listEvents(
  query: ListEventsQuery,
  user?: AuthenticatedUser,
): Promise<{
  events: Array<Event & { organizer: { id: string; name: string; email: string } }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const { status, category, search, from, to, page = 1, limit = 20 } = query;

  const where: Record<string, unknown> = {};

  const canReadDrafts = user && hasPermission(user.role, 'events:read:drafts');

  if (!canReadDrafts) {
    // Public and ordinary users only see PUBLISHED events
    where.status = EventStatus.PUBLISHED;
  } else if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (from || to) {
    const startsAtFilter: Record<string, Date> = {};
    if (from) startsAtFilter.gte = new Date(from);
    if (to) startsAtFilter.lte = new Date(to);
    where.startsAt = startsAtFilter;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { venue: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, events] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startsAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
