import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../lib/api-errors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LogIn, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for testing all four canonical seed roles
  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password1');
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-headline font-bold text-dark-text light:text-light-text">
          Sign In to CampusFlow
        </h2>
        <p className="text-xs text-dark-muted light:text-light-muted mt-1">
          Access your student organization portal and workspace
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded bg-status-error-bg border border-status-error-border text-status-error-text text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="student@campus.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" variant="primary" className="w-full h-10 mt-2" isLoading={isLoading}>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </form>

      {/* Demo Credentials Quick Switcher */}
      <div className="pt-4 border-t border-dark-border/60 light:border-light-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-dark-muted mb-2 light:text-light-muted">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Quick Demo Roles (Local Seed Accounts)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@campus.edu')}
            className="p-2 rounded bg-dark-canvas hover:bg-dark-elevated border border-dark-border text-left transition-colors light:bg-light-elevated light:border-light-border"
          >
            <div className="font-semibold text-brand">Admin</div>
            <div className="text-dark-muted truncate">admin@campus.edu</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('eventmanager@campus.edu')}
            className="p-2 rounded bg-dark-canvas hover:bg-dark-elevated border border-dark-border text-left transition-colors light:bg-light-elevated light:border-light-border"
          >
            <div className="font-semibold text-cyan-400">Event Manager</div>
            <div className="text-dark-muted truncate">eventmanager@campus.edu</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('treasurer@campus.edu')}
            className="p-2 rounded bg-dark-canvas hover:bg-dark-elevated border border-dark-border text-left transition-colors light:bg-light-elevated light:border-light-border"
          >
            <div className="font-semibold text-amber-400">Treasurer</div>
            <div className="text-dark-muted truncate">treasurer@campus.edu</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('member@campus.edu')}
            className="p-2 rounded bg-dark-canvas hover:bg-dark-elevated border border-dark-border text-left transition-colors light:bg-light-elevated light:border-light-border"
          >
            <div className="font-semibold text-emerald-400">Club Member</div>
            <div className="text-dark-muted truncate">member@campus.edu</div>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-dark-muted light:text-light-muted">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-brand font-semibold hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}
