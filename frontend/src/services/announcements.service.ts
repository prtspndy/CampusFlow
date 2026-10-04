import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import {
  Announcement,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '../types/announcements';

export interface ListAnnouncementsResult {
  announcements: Announcement[];
  total: number;
  page: number;
  limit: number;
}

export const announcementsService = {
  async listPublished(params?: {
    audience?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ListAnnouncementsResult> {
    const response = await apiClient.get<ApiResponse<ListAnnouncementsResult>>('/announcements', {
      params,
    });
    return response.data.data;
  },

  async listManaged(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ListAnnouncementsResult> {
    const response = await apiClient.get<ApiResponse<ListAnnouncementsResult>>(
      '/announcements/manage',
      { params },
    );
    return response.data.data;
  },

  async getAnnouncementById(id: string): Promise<Announcement> {
    const response = await apiClient.get<ApiResponse<Announcement>>(`/announcements/${id}`);
    return response.data.data;
  },

  async createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
    const response = await apiClient.post<ApiResponse<Announcement>>('/announcements', input);
    return response.data.data;
  },

  async updateAnnouncement(id: string, input: UpdateAnnouncementInput): Promise<Announcement> {
    const response = await apiClient.patch<ApiResponse<Announcement>>(`/announcements/${id}`, input);
    return response.data.data;
  },

  async publishAnnouncement(id: string): Promise<Announcement> {
    const response = await apiClient.post<ApiResponse<Announcement>>(
      `/announcements/${id}/publish`,
    );
    return response.data.data;
  },

  async unpublishAnnouncement(id: string): Promise<Announcement> {
    const response = await apiClient.post<ApiResponse<Announcement>>(
      `/announcements/${id}/unpublish`,
    );
    return response.data.data;
  },
};
