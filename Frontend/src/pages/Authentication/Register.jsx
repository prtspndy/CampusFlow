import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Buttons/Button';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import { showSuccessToast, showErrorToast } from '../../components/Modal/confirmDialog';

const Register = () => {
  const { register: registerAuth, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      studentId: '',
      email: '',
      department: 'Computer Science',
      year: 'Freshman',
      role: 'General Member',
      password: '',
      agreeTerms: false,
    },
  });

  const onSubmit = async (data) => {
    const res = await registerAuth(data);
    if (res.success) {
      showSuccessToast('Registration successful! Welcome to Skyline SA.');
      navigate('/dashboard');
    } else {
      showErrorToast(res.error || 'Registration failed');
    }
  };

  return (
    <div className="cf-card p-4 p-sm-5 bg-white shadow-md border-0 animate-fade-in">
      <div className="text-center mb-4">
        <h3 className="fw-bold text-dark mb-1">Create Student Account</h3>
        <p className="text-muted small">
          Join the Skyline Student Association platform
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="Full Name"
          name="fullName"
          icon="bi-person"
          placeholder="e.g. Jordan Miller"
          error={errors.fullName?.message}
          {...register('fullName', { required: 'Full name is required' })}
        />

        <div className="row g-2">
          <div className="col-12 col-sm-6">
            <InputField
              label="Student ID"
              name="studentId"
              icon="bi-card-heading"
              placeholder="STU-94000"
              error={errors.studentId?.message}
              {...register('studentId', { required: 'Student ID is required' })}
            />
          </div>
          <div className="col-12 col-sm-6">
            <SelectField
              label="Academic Year"
              name="year"
              options={['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']}
              {...register('year')}
            />
          </div>
        </div>

        <InputField
          label="University Email"
          name="email"
          type="email"
          icon="bi-envelope"
          placeholder="name@skyline.edu"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />

        <div className="row g-2">
          <div className="col-12 col-sm-6">
            <InputField
              label="Department / Major"
              name="department"
              icon="bi-book"
              placeholder="e.g. Data Science"
              {...register('department')}
            />
          </div>
          <div className="col-12 col-sm-6">
            <SelectField
              label="Interest / Role"
              name="role"
              options={[
                'General Member',
                'Event Volunteer',
                'Marketing & Design',
                'Logistics Crew',
                'Tech & Web Team'
              ]}
              {...register('role')}
            />
          </div>
        </div>

        <InputField
          label="Create Password"
          name="password"
          type="password"
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

        <div className="form-check mb-4">
          <input
            type="checkbox"
            className={`form-check-input ${errors.agreeTerms ? 'is-invalid' : ''}`}
            id="agreeTerms"
            {...register('agreeTerms', {
              required: 'You must agree to the club charter and code of conduct',
            })}
          />
          <label htmlFor="agreeTerms" className="form-check-label text-muted small">
            I agree to the <a href="#charter" className="text-primary text-decoration-none">Club Charter</a> & Code of Conduct
          </label>
          {errors.agreeTerms && (
            <div className="text-danger small">{errors.agreeTerms.message}</div>
          )}
        </div>

        <div className="d-flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-50 justify-content-center"
            onClick={() => navigate('/login')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-50 justify-content-center"
            loading={loading}
            icon="bi-check2-circle"
          >
            Register
          </Button>
        </div>
      </form>

      <div className="text-center mt-4 pt-3 border-top border-light-subtle">
        <span className="text-muted small">Already a member? </span>
        <Link to="/login" className="small fw-semibold text-primary text-decoration-none">
          Sign In here
        </Link>
      </div>
    </div>
  );
};

export default Register;
