import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getNavItemsForRole } from '../../constants/navigation';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_ORG_INFO } from '../../constants/mockData';
import { showConfirmDialog, showSuccessToast } from '../Modal/confirmDialog';

const Sidebar = () => {
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentRole = user?.role || 'Super Admin';
  const navGroups = getNavItemsForRole(currentRole);

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

  const sidebarContent = (
    <div className="d-flex flex-column h-100 bg-white border-end border-light-subtle">
      {/* Association Brand Header in Sidebar */}
      <div
        className="d-flex align-items-center justify-content-between px-3 px-xl-4 border-bottom border-light-subtle"
        style={{ height: 'var(--cf-navbar-height)' }}
      >
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white flex-shrink-0 shadow-xs"
            style={{ width: '34px', height: '34px' }}
          >
            <i className="bi bi-layers-fill fs-6" />
          </div>
          {!isCollapsed && (
            <div className="text-truncate">
              <span className="fw-bold text-dark text-sm d-block text-truncate">
                {INITIAL_ORG_INFO.shortName}
              </span>
              <span className="badge bg-primary bg-opacity-10 text-primary text-xs px-1.5 py-0.5 rounded-pill">
                {currentRole}
              </span>
            </div>
          )}
        </div>

        {/* Close button on mobile */}
        <button
          type="button"
          className="btn btn-sm btn-light border-0 d-lg-none text-secondary p-1"
          onClick={closeMobileSidebar}
          aria-label="Close Sidebar"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* Nav Link List */}
      <div className="flex-grow-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-3">
            {!isCollapsed && (
              <span
                className="px-3 mb-1 text-uppercase text-muted fw-semibold d-block"
                style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}
              >
                {group.category}
              </span>
            )}

            <nav className="nav flex-column gap-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-sm fw-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-secondary hover-bg-light'
                    } ${isCollapsed ? 'justify-content-center px-2' : ''}`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--cf-primary)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--cf-text-secondary)',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <i
                    className={`bi ${item.icon} fs-5 flex-shrink-0`}
                    style={{ minWidth: '20px' }}
                  />

                  {!isCollapsed && (
                    <span className="flex-grow-1 text-truncate">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className="badge rounded-pill bg-light text-dark border px-2 py-0.5 text-xs fw-semibold"
                      style={{ fontSize: '0.68rem' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        {/* Explicit Logout Item at end of sidebar as requested for all roles */}
        <div className="pt-2 border-top border-light-subtle mt-2">
          <button
            type="button"
            className={`btn w-100 d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-sm fw-medium text-danger border-0 ${
              isCollapsed ? 'justify-content-center px-2' : ''
            }`}
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
            style={{ backgroundColor: 'transparent' }}
          >
            <i className="bi bi-box-arrow-right fs-5 flex-shrink-0" style={{ minWidth: '20px' }} />
            {!isCollapsed && <span className="flex-grow-1 text-start">Logout</span>}
          </button>
        </div>
      </div>

      {/* Bottom Org Status Box */}
      {!isCollapsed && (
        <div className="p-3 border-top border-light-subtle bg-light bg-opacity-40">
          <div className="p-2.5 rounded-3 bg-white border border-light-subtle shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-xs text-muted fw-medium">Term Balance</span>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold text-xs">
                Active
              </span>
            </div>
            <div className="fw-bold fs-6 text-dark">
              ${INITIAL_ORG_INFO.currentBalance.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`d-none d-lg-block position-fixed top-0 start-0 h-100 transition-all ${
          isCollapsed ? 'sidebar-collapsed' : 'sidebar-open'
        }`}
        style={{
          width: isCollapsed
            ? 'var(--cf-sidebar-collapsed-width)'
            : 'var(--cf-sidebar-width)',
          zIndex: 1030,
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none animate-fade-in"
          style={{ zIndex: 1040 }}
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`position-fixed top-0 start-0 h-100 bg-white d-lg-none shadow-lg transition-transform ${
          isMobileOpen ? 'translate-middle-x-none' : ''
        }`}
        style={{
          width: '280px',
          zIndex: 1050,
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
