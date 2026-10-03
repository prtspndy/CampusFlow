import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS } from '../../constants/roles';
import { showConfirmDialog, showSuccessToast } from '../Modal/confirmDialog';

const ProfileDropdown = ({ isOpen, onClose }) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRoleSwitch = (role) => {
    const targetRoute = switchRole(role);
    showSuccessToast(`Switched active role to: ${role}`);
    onClose();
    navigate(targetRoute);
  };

  const handleLogout = async () => {
    onClose();
    const confirmed = await showConfirmDialog({
      title: 'Sign Out?',
      text: 'Are you sure you want to end your current session?',
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Stay Logged In',
      icon: 'question',
    });

    if (confirmed) {
      logout();
      showSuccessToast('Logged out successfully');
      navigate('/login');
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="position-absolute end-0 mt-2 cf-card shadow-lg bg-white border overflow-hidden animate-fade-in"
      style={{ width: '280px', zIndex: 1060, borderRadius: '12px' }}
    >
      {/* Header Info */}
      <div className="p-3 border-bottom bg-light bg-opacity-50">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <p className="fw-bold text-dark mb-0 small text-truncate">{user?.name || 'Alex Rivera'}</p>
          <span className="badge bg-primary bg-opacity-10 text-primary text-xs">
            {user?.role || 'Super Admin'}
          </span>
        </div>
        <p className="text-muted text-xs mb-1.5 text-truncate">{user?.email}</p>
        <span className="cf-badge cf-badge-neutral text-xs">{user?.studentId || 'FAC-88019'}</span>
      </div>

      {/* Switch Demo Role Section */}
      <div className="p-2 border-bottom bg-light bg-opacity-25">
        <span className="text-xs fw-bold text-muted text-uppercase d-block px-2 mb-1" style={{ fontSize: '0.65rem' }}>
          Switch Role (Demo Preview):
        </span>
        <div className="d-flex flex-wrap gap-1 px-1">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.role}
              type="button"
              className={`btn btn-xs py-1 px-2 text-xs rounded-2 ${
                user?.role === demo.role
                  ? 'btn-primary text-white fw-bold shadow-xs'
                  : 'btn-outline-secondary border-light-subtle bg-white text-secondary'
              }`}
              onClick={() => handleRoleSwitch(demo.role)}
            >
              {demo.role}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-1">
        <Link
          to="/profile"
          className="dropdown-item py-2 px-3 rounded d-flex align-items-center gap-2 text-secondary small"
          onClick={onClose}
        >
          <i className="bi bi-person text-primary" /> My Profile
        </Link>
        <Link
          to="/settings"
          className="dropdown-item py-2 px-3 rounded d-flex align-items-center gap-2 text-secondary small"
          onClick={onClose}
        >
          <i className="bi bi-gear text-secondary" /> Account Settings
        </Link>
        <div className="dropdown-divider my-1" />
        <button
          type="button"
          className="dropdown-item py-2 px-3 rounded d-flex align-items-center gap-2 text-danger small"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
