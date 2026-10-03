export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorDetail {
  field?: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: ApiErrorDetail[]
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
