export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CLUBS: '/clubs',
  CLUB_DETAIL: (id: string = ':id') => `/clubs/${id}`,
  EVENTS: '/events',
  EVENT_DETAIL: (id: string = ':id') => `/events/${id}`,
  BUDGET: '/budget',
  APPROVALS: '/approvals',
} as const
