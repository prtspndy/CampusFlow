import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthSession, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { authService } from '../services/auth.service';
import { setAccessToken } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<User>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    sessionStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  // Restore session on application startup
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedRefreshToken = sessionStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const session = await authService.refresh(storedRefreshToken);
        if (isMounted) {
          setAccessToken(session.token);
          sessionStorage.setItem('refreshToken', session.refreshToken);
          setUser(session.user);
        }
      } catch {
        if (isMounted) {
          clearAuth();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    // Listen for session expired events from axios interceptor
    const handleSessionExpired = () => {
      clearAuth();
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [clearAuth]);

  const login = async (credentials: LoginCredentials): Promise<AuthSession> => {
    const session = await authService.login(credentials);
    setAccessToken(session.token);
    sessionStorage.setItem('refreshToken', session.refreshToken);
    setUser(session.user);
    return session;
  };

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    const newUser = await authService.register(credentials);
    return newUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      clearAuth();
    }
  };

  const updateProfile = async (name: string): Promise<User> => {
    const updated = await authService.updateMe({ name });
    setUser((prev) => (prev ? { ...prev, name: updated.name } : updated));
    return updated;
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const current = await authService.getMe();
      setUser(current);
      return current;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
