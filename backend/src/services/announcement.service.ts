import { AnnouncementStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedUser, hasPermission } from '../types/auth.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import {
  CreateAnnouncementInput,
  ListAnnouncementsQuery,
  UpdateAnnouncementInput,
} from '../validators/phase4.validators.js';

const authorSelect = { id: true, name: true, role: true } as const;

function present(row: {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  audience: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; role: string };
}) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status,
    audience: row.audience,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    authorId: row.author.id,
    authorName: row.author.name,
    authorRole: row.author.role,
  };
}

export async function listPublished(query: ListAnnouncementsQuery) {
  const where: Prisma.AnnouncementWhereInput = { status: AnnouncementStatus.PUBLISHED };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { body: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [total, rows] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: { author: { select: authorSelect } },
      orderBy: { publishedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);
  return {
    announcements: rows.map(present),
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function listManaged(user: AuthenticatedUser, query: ListAnnouncementsQuery) {
  const canPublish = hasPermission(user.role, 'announcements.publish');
  const where: Prisma.AnnouncementWhereInput = canPublish ? {} : { authorId: user.id };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { body: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [total, rows] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: { author: { select: authorSelect } },
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);
  return {
    announcements: rows.map(present),
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

async function loadAnnouncement(id: string) {
  const row = await prisma.announcement.findUnique({
    where: { id },
    include: { author: { select: authorSelect } },
  });
  if (!row) throw new NotFoundError('Announcement not found');
  return row;
}

function canSeeDraft(user: AuthenticatedUser | undefined, authorId: string): boolean {
  if (!user) return false;
  if (hasPermission(user.role, 'announcements.publish')) return true;
  return hasPermission(user.role, 'announcements.create') && user.id === authorId;
}

export async function getAnnouncement(id: string, user?: AuthenticatedUser) {
  const row = await loadAnnouncement(id);
  if (row.status !== AnnouncementStatus.PUBLISHED && !canSeeDraft(user, row.authorId)) {
    throw new NotFoundError('Announcement not found');
  }
  return present(row);
}

export async function createAnnouncement(user: AuthenticatedUser, input: CreateAnnouncementInput) {
  const row = await prisma.announcement.create({
    data: {
      title: input.title,
      body: input.body,
      audience: input.audience,
      authorId: user.id,
      status: AnnouncementStatus.DRAFT,
    },
    include: { author: { select: authorSelect } },
  });
  return present(row);
}

export async function updateAnnouncement(
  user: AuthenticatedUser,
  id: string,
  input: UpdateAnnouncementInput,
) {
  const row = await loadAnnouncement(id);
  const canPublish = hasPermission(user.role, 'announcements.publish');
  if (row.authorId !== user.id && !canPublish) {
    throw new ForbiddenError('You do not have permission to edit this announcement');
  }
  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.audience !== undefined ? { audience: input.audience } : {}),
    },
    include: { author: { select: authorSelect } },
  });
  return present(updated);
}

export async function setPublished(user: AuthenticatedUser, id: string, publish: boolean) {
  if (!hasPermission(user.role, 'announcements.publish')) {
    throw new ForbiddenError('You do not have permission to publish announcements');
  }
  const changed = await prisma.announcement.updateMany({
    where: {
      id,
      status: publish ? AnnouncementStatus.DRAFT : AnnouncementStatus.PUBLISHED,
    },
    data: publish
      ? { status: AnnouncementStatus.PUBLISHED, publishedAt: new Date() }
      : { status: AnnouncementStatus.DRAFT, publishedAt: null },
  });
  if (changed.count !== 1) {
    const row = await prisma.announcement.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('Announcement not found');
    throw new ConflictError(
      publish ? 'Announcement is already published' : 'Announcement is already a draft',
      publish ? 'ALREADY_PUBLISHED' : 'ALREADY_DRAFT',
    );
  }
  return present(await loadAnnouncement(id));
}
