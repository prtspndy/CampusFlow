import { prisma } from '../lib/prisma.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import type {
  CreateOpportunityInput,
  ListOpportunitiesQuery,
  UpdateOpportunityInput,
} from '../validators/volunteer.validators.js';
import { OpportunityStatus, VolunteerSignupStatus } from '@prisma/client';

export async function createOpportunity(organizerId: string, input: CreateOpportunityInput) {
  if (input.eventId) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) {
      throw new NotFoundError('Associated event not found', 'EVENT_NOT_FOUND');
    }
  }

  const opportunity = await prisma.volunteerOpportunity.create({
    data: {
      title: input.title,
      description: input.description,
      location: input.location,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : null,
      capacity: input.capacity,
      category: input.category ?? null,
      eligibility: input.eligibility ?? null,
      eventId: input.eventId ?? null,
      status: input.status ?? OpportunityStatus.DRAFT,
      organizerId,
    },
    include: {
      organizer: { select: { id: true, name: true, email: true, role: true } },
      event: { select: { id: true, title: true, startsAt: true, venue: true } },
    },
  });

  return {
    ...opportunity,
    spotsRemaining: Math.max(0, opportunity.capacity - opportunity.registeredCount),
  };
}

export async function getOpportunity(id: string, canManage: boolean) {
  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, email: true, role: true } },
      event: { select: { id: true, title: true, startsAt: true, venue: true } },
    },
  });

  if (!opportunity) {
    throw new NotFoundError('Volunteer opportunity not found', 'OPPORTUNITY_NOT_FOUND');
  }

  if (!canManage && opportunity.status !== OpportunityStatus.PUBLISHED) {
    throw new NotFoundError('Volunteer opportunity not found', 'OPPORTUNITY_NOT_FOUND');
  }

  return {
    ...opportunity,
    spotsRemaining: Math.max(0, opportunity.capacity - opportunity.registeredCount),
  };
}

export async function listOpportunities(query: ListOpportunitiesQuery, canManage: boolean) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (!canManage) {
    where.status = OpportunityStatus.PUBLISHED;
  } else if (query.status) {
    where.status = query.status;
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.eventId) {
    where.eventId = query.eventId;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { location: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, opportunities] = await Promise.all([
    prisma.volunteerOpportunity.count({ where }),
    prisma.volunteerOpportunity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startsAt: 'asc' },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true } },
      },
    }),
  ]);

  const items = opportunities.map((opp) => ({
    ...opp,
    spotsRemaining: Math.max(0, opp.capacity - opp.registeredCount),
  }));

  return {
    opportunities: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function updateOpportunity(id: string, input: UpdateOpportunityInput) {
  const existing = await prisma.volunteerOpportunity.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Volunteer opportunity not found', 'OPPORTUNITY_NOT_FOUND');
  }

  if (input.capacity !== undefined && input.capacity < existing.registeredCount) {
    throw new BadRequestError(
      `Capacity cannot be set below current registered participant count (${existing.registeredCount})`,
      [],
      'INVALID_CAPACITY',
    );
  }

  if (input.eventId) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) {
      throw new NotFoundError('Associated event not found', 'EVENT_NOT_FOUND');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.location !== undefined) data.location = input.location;
  if (input.startsAt !== undefined) data.startsAt = new Date(input.startsAt);
  if (input.endsAt !== undefined) data.endsAt = new Date(input.endsAt);
  if (input.applicationDeadline !== undefined) {
    data.applicationDeadline = input.applicationDeadline ? new Date(input.applicationDeadline) : null;
  }
  if (input.capacity !== undefined) data.capacity = input.capacity;
  if (input.category !== undefined) data.category = input.category;
  if (input.eligibility !== undefined) data.eligibility = input.eligibility;
  if (input.eventId !== undefined) data.eventId = input.eventId;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.volunteerOpportunity.update({
    where: { id },
    data,
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true } },
    },
  });

  return {
    ...updated,
    spotsRemaining: Math.max(0, updated.capacity - updated.registeredCount),
  };
}

export async function setOpportunityStatus(id: string, status: OpportunityStatus) {
  const existing = await prisma.volunteerOpportunity.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Volunteer opportunity not found', 'OPPORTUNITY_NOT_FOUND');
  }

  const updated = await prisma.volunteerOpportunity.update({
    where: { id },
    data: { status },
  });

  return {
    ...updated,
    spotsRemaining: Math.max(0, updated.capacity - updated.registeredCount),
  };
}

export async function signupForOpportunity(opportunityId: string, userId: string, notes?: string) {
  return await prisma.$transaction(async (tx) => {
    const opportunity = await tx.volunteerOpportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity || opportunity.status !== OpportunityStatus.PUBLISHED) {
      throw new BadRequestError('Volunteer opportunity is not available for registration', [], 'OPPORTUNITY_NOT_OPEN');
    }

    if (opportunity.applicationDeadline && new Date() > new Date(opportunity.applicationDeadline)) {
      throw new BadRequestError('Application deadline for this opportunity has passed', [], 'APPLICATION_DEADLINE_PASSED');
    }

    const existingSignup = await tx.volunteerRegistration.findUnique({
      where: {
        opportunityId_userId: {
          opportunityId,
          userId,
        },
      },
    });

    if (existingSignup) {
      if (existingSignup.status === VolunteerSignupStatus.REGISTERED) {
        throw new ConflictError('You are already registered for this opportunity', 'ALREADY_SIGNED_UP');
      }
      if (existingSignup.status === VolunteerSignupStatus.ATTENDED) {
        throw new ConflictError('You have already attended this opportunity', 'ALREADY_ATTENDED');
      }
    }

    // Concurrency-safe atomic capacity reservation
    const oppUpdate = await tx.volunteerOpportunity.updateMany({
      where: {
        id: opportunityId,
        status: OpportunityStatus.PUBLISHED,
        registeredCount: { lt: opportunity.capacity },
      },
      data: {
        registeredCount: { increment: 1 },
      },
    });

    if (oppUpdate.count === 0) {
      throw new ConflictError('This volunteer opportunity has reached maximum capacity', 'CAPACITY_REACHED');
    }

    let registration;
    if (existingSignup) {
      registration = await tx.volunteerRegistration.update({
        where: { id: existingSignup.id },
        data: {
          status: VolunteerSignupStatus.REGISTERED,
          cancelledAt: null,
          notes: notes ?? existingSignup.notes,
        },
      });
    } else {
      registration = await tx.volunteerRegistration.create({
        data: {
          opportunityId,
          userId,
          status: VolunteerSignupStatus.REGISTERED,
          notes: notes ?? null,
        },
      });
    }

    return {
      ...registration,
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        startsAt: opportunity.startsAt,
        location: opportunity.location,
      },
    };
  });
}

export async function cancelSignup(signupId: string, currentUserId: string, canManage: boolean) {
  return await prisma.$transaction(async (tx) => {
    const signup = await tx.volunteerRegistration.findUnique({
      where: { id: signupId },
      include: { opportunity: true },
    });

    if (!signup) {
      throw new NotFoundError('Volunteer registration not found', 'SIGNUP_NOT_FOUND');
    }

    if (signup.userId !== currentUserId && !canManage) {
      throw new ForbiddenError('You can only cancel your own volunteer registration', 'FORBIDDEN');
    }

    if (signup.status !== VolunteerSignupStatus.REGISTERED) {
      throw new BadRequestError(
        `Cannot cancel registration with status ${signup.status}`,
        [],
        'INVALID_STATUS_TRANSITION',
      );
    }

    const updatedSignup = await tx.volunteerRegistration.update({
      where: { id: signupId },
      data: {
        status: VolunteerSignupStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    await tx.volunteerOpportunity.updateMany({
      where: { id: signup.opportunityId, registeredCount: { gt: 0 } },
      data: {
        registeredCount: {
          decrement: 1,
        },
      },
    });

    return updatedSignup;
  });
}

export async function listMySignups(userId: string) {
  return await prisma.volunteerRegistration.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          startsAt: true,
          endsAt: true,
          status: true,
          category: true,
        },
      },
    },
  });
}

export async function listParticipants(opportunityId: string) {
  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!opportunity) {
    throw new NotFoundError('Volunteer opportunity not found', 'OPPORTUNITY_NOT_FOUND');
  }

  const participants = await prisma.volunteerRegistration.findMany({
    where: { opportunityId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      attendedBy: { select: { id: true, name: true } },
    },
  });

  return {
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      capacity: opportunity.capacity,
      registeredCount: opportunity.registeredCount,
      status: opportunity.status,
    },
    participants,
  };
}

export async function updateAttendance(
  signupId: string,
  markerUserId: string,
  status: VolunteerSignupStatus,
  attendanceNotes?: string,
) {
  const signup = await prisma.volunteerRegistration.findUnique({
    where: { id: signupId },
  });

  if (!signup) {
    throw new NotFoundError('Volunteer registration not found', 'SIGNUP_NOT_FOUND');
  }

  return await prisma.volunteerRegistration.update({
    where: { id: signupId },
    data: {
      status,
      attendanceNotes: attendanceNotes ?? signup.attendanceNotes,
      attendedAt: status === VolunteerSignupStatus.ATTENDED ? new Date() : null,
      attendedById: markerUserId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      attendedBy: { select: { id: true, name: true } },
    },
  });
}
