export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  CLUBS: {
    LIST: '/clubs',
    DETAILS: (id: string) => `/clubs/${id}`,
    MEMBERS: (id: string) => `/clubs/${id}/members`,
    JOIN: (id: string) => `/clubs/${id}/join`,
  },
  EVENTS: {
    LIST: '/events',
    DETAILS: (id: string) => `/events/${id}`,
    CREATE: '/events',
    RSVP: (id: string) => `/events/${id}/rsvp`,
  },
  BUDGET: {
    OVERVIEW: (clubId: string) => `/clubs/${clubId}/budget`,
    EXPENSES: (clubId: string) => `/clubs/${clubId}/expenses`,
    REQUESTS: (clubId: string) => `/clubs/${clubId}/budget/requests`,
  },
  APPROVALS: {
    LIST: '/approvals',
    DECISION: (id: string) => `/approvals/${id}/decision`,
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ACTIVITIES: '/dashboard/activities',
  },
} as const
