import { useAuth } from '../../context/AuthContext';
import { MemberDashboard } from './MemberDashboard';
import { AdminDashboard } from './AdminDashboard';
import { EventManagerDashboard } from './EventManagerDashboard';
import { TreasurerDashboard } from './TreasurerDashboard';

export function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <MemberDashboard />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'EVENT_MANAGER':
      return <EventManagerDashboard />;
    case 'TREASURER':
      return <TreasurerDashboard />;
    case 'MEMBER':
    default:
      return <MemberDashboard />;
  }
}
