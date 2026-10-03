import {
  MOCK_MEMBERS,
  MOCK_MEMBERSHIP_TIERS,
  MOCK_EVENTS,
  MOCK_ATTENDANCE,
  MOCK_ANNOUNCEMENTS,
  MOCK_MERCHANDISE,
  MOCK_ORDERS,
  MOCK_VOLUNTEERS,
  MOCK_TASKS,
  MOCK_TRANSACTIONS,
  MOCK_FINANCE_METRICS,
  MOCK_DASHBOARD_STATS,
  INITIAL_USER,
  INITIAL_ORG_INFO
} from '../constants/mockData';

// Simulated delay helper
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

export const MockService = {
  // Auth
  async login(credentials) {
    await delay(300);
    return {
      token: 'jwt_mock_token_campusflow_2026',
      user: {
        ...INITIAL_USER,
        email: credentials.email || INITIAL_USER.email
      }
    };
  },

  async register(data) {
    await delay(350);
    return {
      token: 'jwt_mock_token_registered',
      user: {
        ...INITIAL_USER,
        name: data.fullName,
        email: data.email,
        studentId: data.studentId,
        role: data.role || 'General Member'
      }
    };
  },

  // Dashboard
  async getDashboardData() {
    await delay();
    return {
      stats: MOCK_DASHBOARD_STATS,
      org: INITIAL_ORG_INFO,
    };
  },

  // Members
  async getMembers() {
    await delay();
    return [...MOCK_MEMBERS];
  },

  // Memberships
  async getMembershipTiers() {
    await delay();
    return [...MOCK_MEMBERSHIP_TIERS];
  },

  // Events
  async getEvents() {
    await delay();
    return [...MOCK_EVENTS];
  },

  // Attendance
  async getAttendance(eventId = 'EVT-2026-01') {
    await delay();
    return MOCK_ATTENDANCE.filter(a => !eventId || a.eventId === eventId);
  },

  // Announcements
  async getAnnouncements() {
    await delay();
    return [...MOCK_ANNOUNCEMENTS];
  },

  // Merchandise
  async getMerchandise() {
    await delay();
    return [...MOCK_MERCHANDISE];
  },

  // Orders
  async getOrders() {
    await delay();
    return [...MOCK_ORDERS];
  },

  // Volunteers
  async getVolunteers() {
    await delay();
    return [...MOCK_VOLUNTEERS];
  },

  // Tasks
  async getTasks() {
    await delay();
    return [...MOCK_TASKS];
  },

  // Finance
  async getFinanceData() {
    await delay();
    return {
      metrics: MOCK_FINANCE_METRICS,
      transactions: [...MOCK_TRANSACTIONS]
    };
  },

  // Reports
  async getReports() {
    await delay();
    return {
      term: 'Spring 2026',
      generatedDate: new Date().toLocaleDateString(),
      metrics: MOCK_FINANCE_METRICS,
    };
  }
};
