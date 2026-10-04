import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../lib/api-errors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserPlus, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-status-success-bg border border-status-success-border text-status-success-text flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-headline font-bold text-dark-text light:text-light-text">
          Account Created!
        </h2>
        <p className="text-xs text-dark-muted light:text-light-muted">
          Your account was registered successfully. Redirecting you to sign in...
        </p>
        <Link to="/login">
          <Button variant="primary" size="sm" className="mt-2">
            Go to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-headline font-bold text-dark-text light:text-light-text">
          Create Student Account
        </h2>
        <p className="text-xs text-dark-muted light:text-light-muted mt-1">
          Join clubs, register for campus events, and manage passes
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded bg-status-error-bg border border-status-error-border text-status-error-text text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="name"
          required
          placeholder="Student Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Campus Email Address"
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
          autoComplete="new-password"
          required
          placeholder="Minimum 8 characters with letter & number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Must contain uppercase, lowercase, number, and special character"
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" variant="primary" className="w-full h-10 mt-2" isLoading={isLoading}>
          <UserPlus className="w-4 h-4 mr-2" />
          Register Account
        </Button>
      </form>

      <div className="text-center text-xs text-dark-muted light:text-light-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-brand font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
