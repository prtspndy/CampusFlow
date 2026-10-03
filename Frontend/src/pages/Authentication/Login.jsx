import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS, ROLES } from '../../constants/roles';
import Button from '../../components/Buttons/Button';
import InputField from '../../components/Forms/InputField';
import { showSuccessToast } from '../../components/Modal/confirmDialog';

const Login = () => {
  const { login, loading, backendStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(ROLES.SUPER_ADMIN);

  const sessionExpired = searchParams.get('session_expired');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'superadmin@campusflow.edu',
      password: 'password123',
      remember: true,
    },
  });

  const onSubmit = async (data) => {
    setServerError(null);
    const res = await login({
      email: data.email,
      password: data.password,
      remember: data.remember,
      targetRole: selectedRole,
    });

    if (res.success) {
      showSuccessToast(`Welcome back, ${res.user.name}!`);
      navigate(res.redirectPath || '/dashboard');
    } else {
      setServerError(res.error || 'Invalid credentials or server error. Please try again.');
    }
  };

  const handleSelectDemo = (demoUser) => {
    setSelectedRole(demoUser.role);
    setValue('email', demoUser.email);
    setValue('password', 'password123');
    setServerError(null);
  };

  return (
    <div className="cf-card p-4 p-sm-5 bg-white shadow-md border-0 animate-fade-in" style={{ borderRadius: '12px' }}>
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary text-white shadow-sm mb-3"
          style={{ width: '48px', height: '48px', fontWeight: 800 }}
        >
          <i className="bi bi-mortarboard-fill fs-4" />
        </div>
        <h3 className="fw-bold text-dark mb-1">Sign in to CampusFlow</h3>
        <p className="text-muted small">
          Student Organization Management System
        </p>
      </div>

      {/* Backend connection indicator */}
      <div className="d-flex align-items-center justify-content-between px-3 py-1.5 rounded-2 bg-light border border-light-subtle mb-3 text-xs">
        <span className="text-muted">API Connection:</span>
        <span className="d-flex align-items-center gap-1.5 fw-semibold text-secondary">
          <span
            className={`rounded-circle ${
              backendStatus === 'healthy' ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: '8px', height: '8px' }}
          />
          {backendStatus === 'healthy' ? 'Connected to Neon/Express' : 'JWT Ready (Local/Hybrid)'}
        </span>
      </div>

      {sessionExpired && (
        <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {serverError && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-x-circle-fill fs-6" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Quick Demo Role Selector */}
      <div className="mb-4 p-3 bg-light rounded-3 border border-light-subtle">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-xs fw-bold text-secondary text-uppercase" style={{ letterSpacing: '0.05em' }}>
            Quick Demo Accounts:
          </span>
          <span className="badge bg-primary bg-opacity-10 text-primary text-xs">
            {selectedRole}
          </span>
        </div>
        <div className="row g-1">
          {DEMO_USERS.map((demo) => {
            const isSelected = selectedRole === demo.role;
            return (
              <div key={demo.role} className="col-4">
                <button
                  type="button"
                  className={`btn btn-xs w-100 py-1.5 px-1 rounded-2 text-truncate text-xs ${
                    isSelected
                      ? 'btn-primary shadow-xs fw-semibold'
                      : 'btn-white border text-dark'
                  }`}
                  onClick={() => handleSelectDemo(demo)}
                  title={`${demo.role}: ${demo.email}`}
                >
                  {demo.role}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <InputField
          label="Email Address"
          name="email"
          type="email"
          icon="bi-envelope"
          placeholder="your.email@campusflow.edu"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address format',
            },
          })}
        />

        {/* Password Field with Eye Toggle */}
        <div className="position-relative">
          <InputField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            icon="bi-lock"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />
          <button
            type="button"
            className="btn btn-link btn-sm position-absolute text-muted border-0 p-0"
            style={{ right: '14px', top: '34px', zIndex: 5 }}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
          </button>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="d-flex align-items-center justify-content-between mb-4 mt-2">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="remember"
              {...register('remember')}
            />
            <label htmlFor="remember" className="form-check-label text-muted small user-select-none">
              Remember Me
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="small text-primary text-decoration-none fw-medium hover-underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button with loading state */}
        <Button
          type="submit"
          variant="primary"
          className="w-100 py-2.5 justify-content-center fw-semibold shadow-sm"
          loading={loading}
          disabled={loading}
          icon="bi-box-arrow-in-right"
        >
          {loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}
        </Button>
      </form>

      {/* Below Login Button: Don't have an account? Sign Up */}
      <div className="text-center mt-4 pt-3 border-top border-light-subtle">
        <span className="text-muted small">Don't have an account? </span>
        <Link to="/signup" className="small fw-bold text-primary text-decoration-none hover-underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default Login;
