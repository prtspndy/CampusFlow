import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ForbiddenPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-status-error-bg border border-status-error-border text-status-error-text flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-extrabold font-mono text-dark-text light:text-light-text">
            403
          </div>
          <h1 className="text-xl font-bold font-headline text-dark-text light:text-light-text">
            Access Restricted
          </h1>
          <p className="text-sm text-dark-muted light:text-light-muted">
            {isAuthenticated
              ? `Your account (${user?.email}) with role [${user?.role}] does not possess administrative or executive privileges for this module.`
              : 'You must authenticate with appropriate permissions to access this internal workspace.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-1.5" />
              Return Home
            </Button>
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                Go to My Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
