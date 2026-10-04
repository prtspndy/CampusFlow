import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileInput,
  User,
} from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', credentials);
    return response.data.data;
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', credentials);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/auth/logout');
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async updateMe(input: UpdateProfileInput): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>('/auth/me', input);
    return response.data.data;
  },
};
