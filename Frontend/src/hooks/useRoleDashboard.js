import { useAuth } from '../context/AuthContext';
import { getRouteForRole } from '../constants/roles';

export const useRoleDashboard = () => {
  const { user } = useAuth();
  const currentRole = user?.role || 'Super Admin';
  const dashboardRoute = getRouteForRole(currentRole);

  return {
    currentRole,
    dashboardRoute,
    isSuperAdmin: currentRole === 'Super Admin',
    isAdmin: currentRole === 'Admin',
    isTreasurer: currentRole === 'Treasurer',
    isEventManager: currentRole === 'Event Manager',
    isVolunteer: currentRole === 'Volunteer',
    isMember: currentRole === 'Member',
  };
};

export default useRoleDashboard;
