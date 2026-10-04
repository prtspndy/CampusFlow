export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: ApiErrorPayload;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface PaginatedResult<T> {
  items?: T[];
  data?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
