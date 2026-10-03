import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRouteForRole } from '../constants/roles';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Authentication Pages
import Login from '../pages/Authentication/Login';
import Signup from '../pages/Authentication/Signup';
import ForgotPassword from '../pages/Authentication/ForgotPassword';

// Role Dashboards
import SuperAdminDashboard from '../pages/Dashboard/SuperAdmin/SuperAdminDashboard';
import AdminDashboard from '../pages/Dashboard/Admin/AdminDashboard';
import TreasurerDashboard from '../pages/Dashboard/Treasurer/TreasurerDashboard';
import EventManagerDashboard from '../pages/Dashboard/EventManager/EventManagerDashboard';
import VolunteerDashboard from '../pages/Dashboard/Volunteer/VolunteerDashboard';
import MemberDashboard from '../pages/Dashboard/Member/MemberDashboard';

// Management Pages
import Members from '../pages/Members/Members';
import Membership from '../pages/Membership/Membership';
import Events from '../pages/Events/Events';
import Tickets from '../pages/Tickets/Tickets';
import Attendance from '../pages/Attendance/Attendance';
import Announcements from '../pages/Announcements/Announcements';
import Merchandise from '../pages/Merchandise/Merchandise';
import Orders from '../pages/Orders/Orders';
import Volunteers from '../pages/Volunteers/Volunteers';
import Tasks from '../pages/Tasks/Tasks';
import Finance from '../pages/Finance/Finance';
import Reports from '../pages/Reports/Reports';
import Profile from '../pages/Profile/Profile';
import Settings from '../pages/Settings/Settings';
import Users from '../pages/Users/Users';
import Roles from '../pages/Roles/Roles';
import NotFound from '../pages/NotFound/NotFound';

/**
 * Dynamic Role Redirect component
 * Directs user to their role-specific dashboard
 */
const DynamicRoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const route = getRouteForRole(user?.role);
  return <Navigate to={route} replace />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <DynamicRoleRedirect />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Main Authenticated Layout Routes */}
      <Route element={<MainLayout />}>
        {/* Dynamic role root /dashboard */}
        <Route path="/dashboard" element={<DynamicRoleRedirect />} />

        {/* 6 Role-Based Dashboards */}
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/treasurer/dashboard" element={<TreasurerDashboard />} />
        <Route path="/event-manager/dashboard" element={<EventManagerDashboard />} />
        <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        <Route path="/member/dashboard" element={<MemberDashboard />} />

        {/* Supporting Operations & Modules */}
        <Route path="/members" element={<Members />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/events" element={<Events />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/merchandise" element={<Merchandise />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
