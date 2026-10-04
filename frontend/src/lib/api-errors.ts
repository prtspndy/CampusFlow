import { AxiosError } from 'axios';
import { ApiResponse } from '../types/api';

export class ApiError extends Error {
  code: string;
  statusCode?: number;
  details?: { field?: string; message: string }[];

  constructor(message: string, code = 'UNKNOWN_ERROR', statusCode?: number, details?: { field?: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as ApiResponse | undefined;

    if (data?.error) {
      return new ApiError(
        data.error.message || 'An error occurred',
        data.error.code || 'API_ERROR',
        status,
        data.error.details,
      );
    }

    if (error.response?.data && typeof error.response.data === 'string') {
      return new ApiError(error.response.data, 'HTTP_ERROR', status);
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new ApiError('Request timed out. Please try again.', 'TIMEOUT', status);
    }

    if (!error.response) {
      return new ApiError('Network error. Unable to reach server.', 'NETWORK_ERROR');
    }

    return new ApiError(error.message || 'Server error', 'HTTP_ERROR', status);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'CLIENT_ERROR');
  }

  return new ApiError('An unexpected error occurred', 'UNKNOWN_ERROR');
}
