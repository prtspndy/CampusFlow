export type Role = 'student' | 'club_lead' | 'faculty_advisor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  studentId?: string
  department?: string
  joinedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}
