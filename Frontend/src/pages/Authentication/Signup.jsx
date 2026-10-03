import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Buttons/Button';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Finance & Economics',
  'Business Administration',
  'Mechanical Engineering',
  'Biochemistry & Pre-Med',
  'Media & Communications',
  'Data Science & Analytics',
  'Psychology & Human Sciences',
  'Arts & Graphic Design',
];

const Signup = () => {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      studentId: '',
      department: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setServerError(null);

    // Call registration endpoint: automatically registers as Member
    const res = await registerUser({
      name: data.fullName,
      fullName: data.fullName,
      studentId: data.studentId,
      department: data.department,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });

    if (res.success) {
      await Swal.fire({
        title: 'Registration Successful!',
        html: `
          <div class="text-center">
            <p class="mb-2 text-secondary">
              Welcome to CampusFlow, <strong>${data.fullName}</strong>!
            </p>
            <div class="p-3 bg-light rounded-3 text-start small border">
              <div><strong>Student ID:</strong> ${data.studentId}</div>
              <div><strong>Department:</strong> ${data.department}</div>
              <div><strong>Email:</strong> ${data.email}</div>
              <div><strong>Assigned Role:</strong> Member</div>
            </div>
            <p class="mt-3 text-muted small mb-0">
              Your account has been registered with JWT credentials. You may now sign in.
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Proceed to Login',
        confirmButtonColor: '#2563EB',
        customClass: {
          popup: 'cf-swal-modal',
        },
      });

      navigate('/login');
    } else {
      setServerError(
        res.error || 'Registration failed. A user with this email may already exist.'
      );
    }
  };

  return (
    <div className="cf-card p-4 p-sm-5 bg-white shadow-md border-0 animate-fade-in my-3" style={{ borderRadius: '12px' }}>
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary text-white shadow-sm mb-3"
          style={{ width: '48px', height: '48px', fontWeight: 800 }}
        >
          <i className="bi bi-person-plus-fill fs-4" />
        </div>
        <h3 className="fw-bold text-dark mb-1">Create Student Account</h3>
        <p className="text-muted small">
          Join your campus organization and connect with student life
        </p>
      </div>

      {serverError && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-octagon-fill fs-6" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Role Notice: No admin registration */}
      <div className="alert alert-light border small text-muted py-2 px-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-shield-check text-primary fs-5" />
        <span>New accounts are assigned the standard <strong>Member</strong> role by university policy.</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Full Name */}
        <InputField
          label="Full Name"
          name="fullName"
          type="text"
          icon="bi-person"
          placeholder="e.g. Jordan Miller"
          error={errors.fullName?.message}
          {...register('fullName', {
            required: 'Full name is required',
            minLength: { value: 3, message: 'Full name must be at least 3 characters' },
          })}
        />

        {/* Student ID & Department in 2 columns */}
        <div className="row g-2">
          <div className="col-sm-6">
            <InputField
              label="Student ID"
              name="studentId"
              type="text"
              icon="bi-card-text"
              placeholder="e.g. STU-94021"
              error={errors.studentId?.message}
              {...register('studentId', {
                required: 'Student ID is required',
              })}
            />
          </div>
          <div className="col-sm-6">
            <SelectField
              label="Department"
              name="department"
              error={errors.department?.message}
              {...register('department', {
                required: 'Please select your department',
              })}
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {/* Email */}
        <InputField
          label="University Email"
          name="email"
          type="email"
          icon="bi-envelope"
          placeholder="student@university.edu"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address format',
            },
          })}
        />

        {/* Phone Number */}
        <InputField
          label="Phone Number"
          name="phone"
          type="tel"
          icon="bi-telephone"
          placeholder="+1 (555) 000-0000"
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Phone number is required',
            pattern: {
              value: /^[+0-9\s\-()]{7,20}$/,
              message: 'Enter a valid phone number',
            },
          })}
        />

        {/* Password */}
        <div className="position-relative">
          <InputField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            icon="bi-lock"
            placeholder="At least 6 characters"
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
            aria-label="Toggle password visibility"
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
          </button>
        </div>

        {/* Confirm Password */}
        <div className="position-relative mb-4">
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            icon="bi-shield-check"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === passwordValue || 'Passwords do not match',
            })}
          />
          <button
            type="button"
            className="btn btn-link btn-sm position-absolute text-muted border-0 p-0"
            style={{ right: '14px', top: '34px', zIndex: 5 }}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label="Toggle confirm password visibility"
          >
            <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
          </button>
        </div>

        {/* Action Buttons: Register & Back to Login */}
        <div className="d-flex flex-column gap-2">
          <Button
            type="submit"
            variant="primary"
            className="w-100 py-2.5 justify-content-center fw-semibold shadow-sm"
            loading={loading}
            disabled={loading}
            icon="bi-check-circle-fill"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </Button>

          <Link
            to="/login"
            className="btn btn-cf-outline w-100 py-2.5 justify-content-center text-decoration-none"
          >
            <i className="bi bi-arrow-left me-1" /> Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
