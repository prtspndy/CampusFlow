import { User } from './auth';

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED';
export type AnnouncementAudience = 'ALL_MEMBERS' | 'VOLUNTEERS' | 'EVENT_ATTENDEES';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  status: AnnouncementStatus;
  audience: AnnouncementAudience;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  audience?: AnnouncementAudience;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  audience?: AnnouncementAudience;
}
