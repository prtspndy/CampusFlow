import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import Avatar from '../../components/Cards/Avatar';
import Badge from '../../components/Cards/Badge';
import InputField from '../../components/Forms/InputField';
import TextareaField from '../../components/Forms/TextareaField';
import { useAuth } from '../../context/AuthContext';
import { showSuccessToast, showErrorToast } from '../../components/Modal/confirmDialog';

const Profile = () => {
  const { user, updateProfile, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    year: '',
    role: '',
    phone: '',
    bio: '',
    linkedin: '',
    github: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || 'STU-94021',
        department: user.department || 'Computer Science & Business',
        year: user.year || 'Senior (Class of 2026)',
        role: user.role || 'Member',
        phone: user.phone || '+1 (555) 329-8812',
        bio:
          user.bio ||
          'Active university member participating in campus programming, community workshops, and student leadership initiatives.',
        linkedin: user.linkedin || 'linkedin.com/in/student-campus',
        github: user.github || 'github.com/student-code',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await updateProfile({
      name: formData.name.trim(),
      department: formData.department,
      phone: formData.phone,
      bio: formData.bio,
      linkedin: formData.linkedin,
      github: formData.github,
    });

    setIsSubmitting(false);

    if (res.success) {
      showSuccessToast('Profile updated successfully!');
    } else {
      setErrorMsg(res.error || 'Failed to save changes. Please try again.');
      showErrorToast(res.error || 'Failed to update profile');
    }
  };

  return (
    <div className="profile-page animate-fade-in pb-4">
      <Breadcrumb
        items={[{ label: 'Account', path: '/dashboard' }, { label: 'User Profile', active: true }]}
        title="Student Profile"
      />

      <div className="row g-4">
        {/* Left Card: Summary & Avatar */}
        <div className="col-12 col-lg-4">
          <div className="cf-card p-4 text-center bg-white h-100" style={{ borderRadius: '12px' }}>
            <div className="mb-3 d-inline-block">
              <Avatar
                src={user?.avatar}
                name={formData.name || 'Student'}
                size="xl"
                status="online"
              />
            </div>

            <h4 className="fw-bold text-dark mb-1">{formData.name || 'Student'}</h4>
            <span className="cf-badge cf-badge-primary mb-3">{formData.role}</span>

            <p className="text-secondary small mb-4">{formData.bio}</p>

            <div className="border-top pt-3 text-start d-flex flex-column gap-2 text-xs">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Student ID</span>
                <strong className="text-dark font-monospace">{formData.studentId}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Registered Email</span>
                <strong className="text-dark text-truncate" style={{ maxWidth: '170px' }}>
                  {formData.email}
                </strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Department</span>
                <strong className="text-dark">{formData.department}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Member Since</span>
                <strong className="text-dark">{user?.joinedDate || 'Sep 2024'}</strong>
              </div>
            </div>

            <div className="border-top pt-3 mt-3">
              <span className="text-xs text-muted d-block mb-2 fw-semibold text-uppercase">
                Verified Credentials
              </span>
              <div className="d-flex flex-wrap gap-1 justify-content-center">
                <Badge variant="primary">🎓 Enrolled Student</Badge>
                <Badge variant="success">🛡️ JWT Verified</Badge>
                <Badge variant="warning">⭐ Active Chapter</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Edit Information Form */}
        <div className="col-12 col-lg-8">
          <div className="cf-card p-4 p-md-5 bg-white" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0 fs-6">Personal & University Information</h5>
                <p className="text-muted small mb-0">
                  Update your contact details, bio, and social links
                </p>
              </div>
              <span className="badge bg-light border text-secondary text-xs">
                PostgreSQL Profile
              </span>
            </div>

            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-x-circle-fill" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Full Name - Editable */}
                <div className="col-12 col-md-6">
                  <InputField
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* University Email - Read-only per backend contract */}
                <div className="col-12 col-md-6">
                  <InputField
                    label="University Email (Read-only)"
                    type="email"
                    value={formData.email}
                    disabled
                    helperText="Email is bound to your university login identity"
                  />
                </div>

                {/* Student ID - Read-only */}
                <div className="col-12 col-md-6">
                  <InputField
                    label="Student ID (Verified)"
                    value={formData.studentId}
                    disabled
                    helperText="University verified student identifier"
                  />
                </div>

                {/* Phone Number - Editable */}
                <div className="col-12 col-md-6">
                  <InputField
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Major / Department - Editable */}
                <div className="col-12 col-md-6">
                  <InputField
                    label="Major / Academic Program"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                {/* Role - Read-only badge display */}
                <div className="col-12 col-md-6">
                  <InputField
                    label="System Role (Read-only)"
                    value={formData.role}
                    disabled
                    helperText="Roles are granted by organization administrators"
                  />
                </div>

                {/* Biography */}
                <div className="col-12">
                  <TextareaField
                    label="Biography"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                {/* Social links */}
                <div className="col-12 col-md-6">
                  <InputField
                    label="LinkedIn Profile"
                    icon="bi-linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <InputField
                    label="GitHub Profile"
                    icon="bi-github"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-light-subtle">
                <Button
                  type="submit"
                  variant="primary"
                  icon="bi-check2"
                  loading={isSubmitting || loading}
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? 'Saving to Database...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
