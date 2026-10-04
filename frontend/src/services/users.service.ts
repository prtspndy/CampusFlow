import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { User, UserRole } from '../types/auth';

export const usersService = {
  async listUsers(): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<{ users: User[] }>>('/admin/users');
    return response.data.data.users;
  },

  async getUserById(userId: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data;
  },

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const response = await apiClient.patch<ApiResponse<{ user: User }>>(`/admin/users/${userId}/role`, {
      role,
    });
    return response.data.data.user;
  },
};
