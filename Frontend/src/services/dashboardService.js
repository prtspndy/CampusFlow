import api from './api';
import {
  MOCK_DASHBOARD_STATS,
  MOCK_EVENTS,
  MOCK_MEMBERS,
  MOCK_ORDERS,
  MOCK_TRANSACTIONS,
  MOCK_TASKS,
  MOCK_ANNOUNCEMENTS,
  INITIAL_ORG_INFO,
} from '../constants/mockData';

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const dashboardService = {
  // Super Admin metrics
  async getSuperAdminDashboard() {
    await wait();
    return {
      cards: [
        { label: 'Total Members', value: '1,248', change: '+14% this month', trend: 'up', icon: 'bi-people-fill', color: 'primary' },
        { label: 'Active Memberships', value: '1,092', change: '87.5% renewal rate', trend: 'up', icon: 'bi-award-fill', color: 'success' },
        { label: 'Events', value: '18', change: '5 upcoming this month', trend: 'neutral', icon: 'bi-calendar-event-fill', color: 'info' },
        { label: 'Income', value: '$18,450', change: '+22% vs last term', trend: 'up', icon: 'bi-graph-up-arrow', color: 'success' },
        { label: 'Expenses', value: '$5,970', change: '32% of semester budget', trend: 'down', icon: 'bi-graph-down-arrow', color: 'warning' },
        { label: 'Balance', value: '$12,480', change: 'Healthy treasury reserve', trend: 'up', icon: 'bi-wallet2', color: 'primary' },
        { label: 'Merchandise Orders', value: '142', change: '+38 orders this week', trend: 'up', icon: 'bi-bag-heart-fill', color: 'secondary' },
        { label: 'Volunteers', value: '64', change: '12 active today', trend: 'up', icon: 'bi-person-heart', color: 'danger' },
      ],
      recentActivities: [
        { id: 1, title: 'Elena Vance registered as Lifetime Member', time: '10 mins ago', type: 'member', icon: 'bi-person-plus-fill', color: 'primary' },
        { id: 2, title: 'Spring Gala 2026 reached 85% ticket capacity', time: '42 mins ago', type: 'event', icon: 'bi-ticket-detailed-fill', color: 'success' },
        { id: 3, title: 'Treasurer Marcus Chen approved $240 banquet deposit', time: '2 hours ago', type: 'finance', icon: 'bi-cash-coin', color: 'warning' },
        { id: 4, title: 'Campus Hackathon volunteer assignments published', time: '4 hours ago', type: 'volunteer', icon: 'bi-check2-circle', color: 'info' },
        { id: 5, title: 'New announcement: End of Semester Voting Guidelines', time: 'Yesterday', type: 'announcement', icon: 'bi-megaphone-fill', color: 'secondary' },
      ],
      orgInfo: INITIAL_ORG_INFO,
    };
  },

  // Admin metrics
  async getAdminDashboard() {
    await wait();
    return {
      cards: [
        { label: 'Members', value: '1,248', change: '+14% active growth', trend: 'up', icon: 'bi-people-fill', color: 'primary' },
        { label: 'Events', value: '5 Active', change: '2 this weekend', trend: 'neutral', icon: 'bi-calendar-event-fill', color: 'info' },
        { label: 'Orders', value: '142 Orders', change: '12 pending shipment', trend: 'up', icon: 'bi-box-seam-fill', color: 'warning' },
        { label: 'Announcements', value: '14 Published', change: '98% member reach', trend: 'up', icon: 'bi-megaphone-fill', color: 'success' },
      ],
      recentMembers: MOCK_MEMBERS.slice(0, 5),
      upcomingEvents: MOCK_EVENTS.slice(0, 3),
      announcements: MOCK_ANNOUNCEMENTS.slice(0, 3),
    };
  },

  // Treasurer metrics
  async getTreasurerDashboard() {
    await wait();
    return {
      cards: [
        { label: 'Total Income', value: '$18,450.00', change: '+22.4% vs last term', trend: 'up', icon: 'bi-arrow-down-left-circle-fill', color: 'success' },
        { label: 'Total Expense', value: '$5,970.50', change: 'Within allocated budget', trend: 'down', icon: 'bi-arrow-up-right-circle-fill', color: 'danger' },
        { label: 'Current Balance', value: '$12,479.50', change: 'Audited & verified', trend: 'up', icon: 'bi-cash-stack', color: 'primary' },
      ],
      monthlyIncomeData: [3200, 4100, 2900, 5400, 2850],
      monthlyExpenseData: [1100, 1400, 850, 1820, 800],
      transactions: MOCK_TRANSACTIONS,
    };
  },

  // Event Manager metrics
  async getEventManagerDashboard() {
    await wait();
    return {
      cards: [
        { label: 'Upcoming Events', value: '5 Events', change: 'Next: Spring Gala', trend: 'up', icon: 'bi-calendar-event-fill', color: 'primary' },
        { label: 'Registered Members', value: '425 Attendees', change: '+68 this week', trend: 'up', icon: 'bi-people-fill', color: 'info' },
        { label: 'Attendance', value: '94.2%', change: 'Avg check-in rate', trend: 'up', icon: 'bi-qr-code-scan', color: 'success' },
        { label: 'Revenue', value: '$4,120.00', change: 'Ticket gross revenue', trend: 'up', icon: 'bi-ticket-detailed-fill', color: 'warning' },
      ],
      events: MOCK_EVENTS,
    };
  },

  // Volunteer metrics
  async getVolunteerDashboard() {
    await wait();
    return {
      cards: [
        { label: 'Pending Tasks', value: '4 Tasks', change: '2 due by tomorrow', trend: 'warning', icon: 'bi-hourglass-split', color: 'warning' },
        { label: 'Completed Tasks', value: '18 Tasks', change: '+3 this week', trend: 'up', icon: 'bi-check2-circle', color: 'success' },
        { label: 'Upcoming Events', value: '3 Shifts', change: 'Next: Hackathon (Sat)', trend: 'neutral', icon: 'bi-calendar-check-fill', color: 'primary' },
      ],
      tasks: MOCK_TASKS,
      events: MOCK_EVENTS.slice(0, 3),
    };
  },

  // Member metrics
  async getMemberDashboard() {
    await wait();
    return {
      cards: [
        { label: 'Membership Status', value: 'Pro Member', change: 'Valid until June 2026', trend: 'up', icon: 'bi-patch-check-fill', color: 'primary' },
        { label: 'Upcoming Events', value: '3 Events', change: '2 tickets confirmed', trend: 'up', icon: 'bi-calendar-heart-fill', color: 'info' },
        { label: 'Purchased Tickets', value: '2 Tickets', change: 'QR pass active', trend: 'neutral', icon: 'bi-qr-code', color: 'success' },
        { label: 'Orders', value: '1 Hoodie', change: 'Ready for pickup', trend: 'warning', icon: 'bi-bag-check-fill', color: 'warning' },
      ],
      upcomingEvents: MOCK_EVENTS,
      announcements: MOCK_ANNOUNCEMENTS.slice(0, 3),
    };
  },
};

export default dashboardService;
