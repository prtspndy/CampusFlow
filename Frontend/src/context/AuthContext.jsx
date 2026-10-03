import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS, ROLES, getRouteForRole } from '../constants/roles';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cf_user');
    return saved ? JSON.parse(saved) : DEMO_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(
      localStorage.getItem('cf_access_token') ||
        localStorage.getItem('cf_auth_token')
    );
  });

  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'healthy' | 'offline' | 'checking'

  // Persist user to localStorage whenever updated
  useEffect(() => {
    if (user) {
      localStorage.setItem('cf_user', JSON.stringify(user));
    }
  }, [user]);

  // Check backend health on mount
  useEffect(() => {
    const verifyHealth = async () => {
      const res = await authService.checkHealth();
      setBackendStatus(res.status);
    };
    verifyHealth();
  }, []);

  /**
   * Log in user with credentials.
   * Calls POST /api/auth/login and stores JWT tokens.
   */
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      setUser(res.user);
      setIsAuthenticated(true);
      return {
        success: true,
        user: res.user,
        redirectPath: getRouteForRole(res.user.role),
        isMock: res.isMock,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new student account.
   * Calls POST /api/auth/register and stores JWT tokens.
   */
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await authService.signup(formData);
      setUser(res.user);
      setIsAuthenticated(true);
      return {
        success: true,
        user: res.user,
        redirectPath: getRouteForRole(res.user.role),
        isMock: res.isMock,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Registration failed. Please check your information.',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile via backend API PUT /users/profile
   */
  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      const updated = await authService.updateProfile(updates);
      setUser((prev) => ({ ...prev, ...updated }));
      return { success: true, user: updated };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Switch Role helper for testing UI
   */
  const switchRole = (roleKeyOrName) => {
    const found = DEMO_USERS.find(
      (u) => u.role === roleKeyOrName || u.roleKey === roleKeyOrName
    );
    if (found) {
      setUser(found);
      localStorage.setItem('cf_access_token', `cf_token_${found.roleKey}`);
      localStorage.setItem('cf_auth_token', `cf_token_${found.roleKey}`);
      return getRouteForRole(found.role);
    }
    return '/super-admin/dashboard';
  };

  /**
   * Logout user and revoke tokens on server
   */
  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        backendStatus,
        login,
        register,
        updateProfile,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
