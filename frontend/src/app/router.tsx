import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { RequireAuth, RequireGuest, RequireRole } from '../components/navigation/ProtectedRoute';
import { UserRole } from '../types/auth';

// Feature Pages
import { HomePage } from '../features/home/HomePage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardRouter } from '../features/dashboard/DashboardRouter';
import { ProfilePage } from '../features/profile/ProfilePage';
import { EventsPage } from '../features/events/EventsPage';
import { EventDetailPage } from '../features/events/EventDetailPage';
import { EventRegistrationsPage } from '../features/events/EventRegistrationsPage';
import { MyTicketsPage } from '../features/tickets/MyTicketsPage';
import { CheckInPage } from '../features/tickets/CheckInPage';
import { MembershipsPage } from '../features/memberships/MembershipsPage';
import { StorePage } from '../features/merchandise/StorePage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { AnnouncementsPage } from '../features/announcements/AnnouncementsPage';
import { VolunteersPage } from '../features/volunteers/VolunteersPage';
import { FundraisersPage } from '../features/fundraisers/FundraisersPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { TreasuryPage } from '../features/treasury/TreasuryPage';
import { UserDirectoryPage } from '../features/users/UserDirectoryPage';
import { NotFoundPage } from '../features/error/NotFoundPage';
import { ForbiddenPage } from '../features/error/ForbiddenPage';

export const router = createBrowserRouter([
  // Guest Authentication Flow (Login / Register)
  {
    element: (
      <RequireGuest>
        <AuthLayout />
      </RequireGuest>
    ),
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },

  // Main Application Shell
  {
    element: <AppLayout />,
    children: [
      // Public Content Routes
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/events',
        element: <EventsPage />,
      },
      {
        path: '/events/:eventId',
        element: <EventDetailPage />,
      },
      {
        path: '/store',
        element: <StorePage />,
      },
      {
        path: '/announcements',
        element: <AnnouncementsPage />,
      },
      {
        path: '/volunteers',
        element: <VolunteersPage />,
      },
      {
        path: '/fundraisers',
        element: <FundraisersPage />,
      },
      {
        path: '/forbidden',
        element: <ForbiddenPage />,
      },

      // Authenticated Member Routes
      {
        path: '/dashboard',
        element: (
          <RequireAuth>
            <DashboardRouter />
          </RequireAuth>
        ),
      },
      {
        path: '/profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: '/memberships',
        element: (
          <RequireAuth>
            <MembershipsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/tickets',
        element: (
          <RequireAuth>
            <MyTicketsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/orders',
        element: (
          <RequireAuth>
            <OrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: '/expenses',
        element: (
          <RequireAuth>
            <ExpensesPage />
          </RequireAuth>
        ),
      },

      // Role-Restricted: Event Managers & Admins
      {
        path: '/checkin',
        element: (
          <RequireRole roles={[UserRole.ADMIN, UserRole.EVENT_MANAGER]}>
            <CheckInPage />
          </RequireRole>
        ),
      },
      {
        path: '/events/:eventId/registrations',
        element: (
          <RequireRole roles={[UserRole.ADMIN, UserRole.EVENT_MANAGER]}>
            <EventRegistrationsPage />
          </RequireRole>
        ),
      },

      // Role-Restricted: Treasurers & Admins
      {
        path: '/treasury',
        element: (
          <RequireRole roles={[UserRole.ADMIN, UserRole.TREASURER]}>
            <TreasuryPage />
          </RequireRole>
        ),
      },

      // Role-Restricted: Full Admins Only
      {
        path: '/admin/users',
        element: (
          <RequireRole roles={[UserRole.ADMIN]}>
            <UserDirectoryPage />
          </RequireRole>
        ),
      },

      // Fallback 404 Route
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
