import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { hasPermission, hasRole } from '../../config/permissions';
import { ShieldAlert } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-canvas text-dark-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface RequireGuestProps {
  children: React.ReactNode;
}

export function RequireGuest({ children }: RequireGuestProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

interface RequireRoleProps {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user, roles)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-dark-surface p-8 rounded-xl border border-dark-border shadow-modal-dark">
          <div className="w-12 h-12 rounded-full bg-status-error-bg border border-status-error-border text-status-error-text flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-headline font-bold text-dark-text mb-2">Access Denied</h2>
          <p className="text-sm text-dark-muted mb-6">
            You do not have the required role permissions to view this workspace. Please contact your organization administrator.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-brand text-white font-medium rounded text-sm hover:bg-brand-hover transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
}

export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(user, permission)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-dark-surface p-8 rounded-xl border border-dark-border shadow-modal-dark">
          <div className="w-12 h-12 rounded-full bg-status-warning-bg border border-status-warning-border text-status-warning-text flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-headline font-bold text-dark-text mb-2">Permission Required</h2>
          <p className="text-sm text-dark-muted mb-6">
            Missing required permission: <code className="text-brand font-mono text-xs">{permission}</code>
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-brand text-white font-medium rounded text-sm hover:bg-brand-hover transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
