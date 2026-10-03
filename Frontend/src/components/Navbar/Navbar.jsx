import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSidebar } from '../../context/SidebarContext';
import Avatar from '../Cards/Avatar';
import ProfileDropdown from './ProfileDropdown';
import { getRouteForRole } from '../../constants/roles';
import { showConfirmDialog, showSuccessToast } from '../Modal/confirmDialog';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isCollapsed, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Sign Out?',
      text: 'Are you sure you want to end your current session?',
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
      icon: 'question',
    });

    if (confirmed) {
      logout();
      showSuccessToast('Logged out successfully');
      navigate('/login');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/members?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const homeDashboardRoute = getRouteForRole(user?.role);

  return (
    <header
      className="sticky-top bg-white border-bottom border-light-subtle d-flex align-items-center px-3 px-lg-4"
      style={{ height: 'var(--cf-navbar-height)', zIndex: 1020 }}
    >
      {/* Left side: Toggle button & Brand */}
      <div className="d-flex align-items-center gap-3">
        {/* Mobile toggle */}
        <button
          type="button"
          className="btn btn-sm btn-light border-0 d-lg-none text-secondary p-1"
          onClick={toggleMobileSidebar}
          aria-label="Toggle Navigation"
        >
          <i className="bi bi-list fs-4" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          className="btn btn-sm btn-light border-0 d-none d-lg-flex align-items-center justify-content-center text-secondary rounded-circle"
          style={{ width: '36px', height: '36px' }}
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${isCollapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'} fs-5`} />
        </button>

        {/* Brand identifier */}
        <Link to={homeDashboardRoute} className="d-flex align-items-center gap-2 text-decoration-none">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white shadow-sm"
            style={{ width: '34px', height: '34px', fontWeight: 800 }}
          >
            <i className="bi bi-layers-fill fs-5" />
          </div>
          <div className="d-flex flex-column">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold fs-5 text-dark" style={{ letterSpacing: '-0.03em' }}>
                Campus<span className="text-primary">Flow</span>
              </span>
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-0.5 text-xs fw-semibold">
                {user?.role || 'Portal'}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Center: Search Box */}
      <div className="mx-auto d-none d-md-flex align-items-center" style={{ width: '380px' }}>
        <form onSubmit={handleSearchSubmit} className="position-relative w-100">
          <i
            className="bi bi-search position-absolute top-50 translate-middle-y text-muted"
            style={{ left: '14px' }}
          />
          <input
            type="text"
            className="cf-input ps-5 pe-5 py-2 text-xs"
            placeholder="Search members, events, orders, records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              className="btn btn-link btn-sm position-absolute top-50 translate-middle-y end-0 me-2 text-muted p-0"
              onClick={() => setSearchQuery('')}
            >
              <i className="bi bi-x-circle-fill" />
            </button>
          ) : (
            <span
              className="position-absolute top-50 translate-middle-y end-0 me-2 text-muted px-1.5 py-0.5 border rounded bg-light"
              style={{ fontSize: '0.65rem' }}
            >
              Ctrl K
            </span>
          )}
        </form>
      </div>

      {/* Right side: Notifications, User Profile, Logout */}
      <div className="d-flex align-items-center gap-2 ms-auto">
        {/* Quick Role Badge indicator */}
        <span className="badge bg-light border text-dark px-2.5 py-1.5 rounded-pill text-xs d-none d-sm-inline-flex align-items-center gap-1">
          <span className="bg-success rounded-circle" style={{ width: '6px', height: '6px' }} />
          {user?.role || 'Student'}
        </span>

        {/* Notifications Dropdown */}
        <div className="position-relative" ref={notifRef}>
          <button
            type="button"
            className="btn btn-sm btn-light border-0 rounded-circle position-relative text-secondary d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <i className="bi bi-bell fs-5" />
            {unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                style={{ fontSize: '0.65rem', padding: '0.25em 0.5em' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 mt-2 cf-card shadow-lg bg-white border overflow-hidden animate-fade-in"
              style={{ width: '340px', zIndex: 1050, borderRadius: '12px' }}
            >
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light bg-opacity-50">
                <span className="fw-bold text-dark small">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-primary text-xs text-decoration-none"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="list-group list-group-flush overflow-y-auto" style={{ maxHeight: '300px' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`list-group-item list-group-item-action p-3 border-0 border-bottom d-flex gap-3 align-items-start ${
                      n.unread ? 'bg-light bg-opacity-25' : ''
                    }`}
                    onClick={() => markAsRead(n.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white bg-${n.color}`}
                      style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                    >
                      <i className={`bi ${n.icon}`} />
                    </div>
                    <div className="flex-grow-1">
                      <p className={`mb-1 small ${n.unread ? 'fw-semibold text-dark' : 'text-secondary'}`}>
                        {n.title}
                      </p>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {n.time}
                      </span>
                    </div>
                    {n.unread && (
                      <span className="rounded-circle bg-primary mt-1" style={{ width: '8px', height: '8px' }} />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-2 text-center border-top bg-light bg-opacity-25">
                <Link
                  to="/announcements"
                  className="small text-primary text-decoration-none fw-medium"
                  onClick={() => setShowNotifications(false)}
                >
                  View all announcements <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger & Profile Dropdown */}
        <div className="position-relative ms-1">
          <button
            type="button"
            className="btn btn-sm p-1 border-0 d-flex align-items-center gap-2 rounded-pill hover-bg-light"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="User Menu"
          >
            <Avatar src={user?.avatar} name={user?.name || 'Alex Rivera'} size="sm" status="online" />
            <div className="d-none d-xl-flex flex-column text-start">
              <span className="fw-semibold text-dark text-xs lh-1">{user?.name}</span>
              <span className="text-muted text-xs lh-1 mt-1">{user?.role || 'Admin'}</span>
            </div>
            <i className="bi bi-chevron-down text-muted text-xs ms-1 d-none d-sm-inline" />
          </button>

          <ProfileDropdown isOpen={showProfileMenu} onClose={() => setShowProfileMenu(false)} />
        </div>

        {/* Direct Logout Button */}
        <button
          type="button"
          className="btn btn-sm btn-light border-0 rounded-circle text-danger d-flex align-items-center justify-content-center ms-1"
          style={{ width: '38px', height: '38px' }}
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Logout"
        >
          <i className="bi bi-box-arrow-right fs-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
