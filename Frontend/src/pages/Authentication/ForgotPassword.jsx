import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Button from '../../components/Buttons/Button';
import InputField from '../../components/Forms/InputField';
import { authService } from '../../services/authService';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);

      await Swal.fire({
        title: 'Reset Link Dispatched!',
        html: `
          <div class="text-center">
            <p class="text-secondary mb-2">
              We have generated a secure password reset link for:
            </p>
            <p class="fw-bold text-primary mb-3">${data.email}</p>
            <div class="p-3 bg-light rounded-3 text-start small border">
              <i class="bi bi-info-circle text-primary me-1"></i>
              Please check your student email or inbox. The reset link remains valid for 30 minutes.
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Return to Login',
        confirmButtonColor: '#2563EB',
        customClass: {
          popup: 'cf-swal-modal',
        },
      });
    } catch {
      Swal.fire({
        title: 'Error',
        text: 'Unable to process your password reset request. Please try again.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cf-card p-4 p-sm-5 bg-white shadow-md border-0 animate-fade-in" style={{ borderRadius: '12px' }}>
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary mb-3"
          style={{ width: '48px', height: '48px' }}
        >
          <i className="bi bi-key-fill fs-4" />
        </div>
        <h3 className="fw-bold text-dark mb-1">Reset Password</h3>
        <p className="text-muted small">
          Enter your registered email address and we'll send you instructions to reset your password.
        </p>
      </div>

      {submittedEmail ? (
        <div className="text-center py-3">
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4 text-start">
            <i className="bi bi-check-circle-fill fs-5 text-success" />
            <div className="small">
              Reset instructions sent to <strong>{submittedEmail}</strong>. Check your inbox and spam folders.
            </div>
          </div>
          <Link
            to="/login"
            className="btn btn-cf-primary w-100 py-2.5 justify-content-center text-decoration-none"
          >
            <i className="bi bi-arrow-left me-1" /> Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <InputField
            label="Registered University Email"
            name="email"
            type="email"
            icon="bi-envelope"
            placeholder="student@campusflow.edu"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <div className="d-flex flex-column gap-2 mt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2.5 justify-content-center fw-semibold shadow-sm"
              loading={loading}
              icon="bi-send-fill"
            >
              Send Reset Link
            </Button>

            <Link
              to="/login"
              className="btn btn-cf-outline w-100 py-2.5 justify-content-center text-decoration-none"
            >
              <i className="bi bi-arrow-left me-1" /> Back to Login
            </Link>
          </div>
        </form>
      )}

      <div className="text-center mt-4 pt-3 border-top border-light-subtle">
        <span className="text-muted small">Need immediate assistance? </span>
        <a href="mailto:support@campusflow.edu" className="small fw-semibold text-primary text-decoration-none">
          Contact IT Support
        </a>
      </div>
    </div>
  );
};

export default ForgotPassword;
