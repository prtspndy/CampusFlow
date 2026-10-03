export const API_ENDPOINTS = {
  HEALTH: {
    LIVE: '/health',
    READY: '/health/ready',
  },
  INFO: '/',
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    BY_ID: (userId: string) => `/users/${userId}`,
  },
  ADMIN: {
    USERS: '/admin/users',
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
  SHOP: {
    PRODUCTS: '/shop/products',
    PRODUCT: (id: string) => `/shop/products/${id}`,
    ORDERS: '/orders',
  },
  ANNOUNCEMENTS: {
    LIST: '/announcements',
    CREATE: '/announcements',
  },
  FUNDRAISERS: {
    LIST: '/fundraisers',
    TASKS: '/tasks',
  },
  TREASURY: {
    TRANSACTIONS: '/treasury/transactions',
    REIMBURSEMENTS: '/treasury/reimbursements',
  },
} as const
