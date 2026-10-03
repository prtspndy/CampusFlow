export const APP_NAME = 'CampusFlow'
export const APP_TAGLINE = 'The Operating System for Student Organizations'

export const ROLES = {
  STUDENT: 'student',
  CLUB_LEAD: 'club_lead',
  FACULTY_ADVISOR: 'faculty_advisor',
  ADMIN: 'admin',
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'campusflow_token',
  REFRESH_TOKEN: 'campusflow_refresh_token',
  USER_DATA: 'campusflow_user',
  THEME: 'campusflow_theme',
} as const

export const DEFAULT_PAGE_SIZE = 10
