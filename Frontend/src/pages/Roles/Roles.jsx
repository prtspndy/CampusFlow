import React from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import StatCard from '../../components/Cards/StatCard';
import { DEMO_USERS } from '../../constants/roles';
import { showSuccessToast } from '../../components/Modal/confirmDialog';

const Roles = () => {
  const rolePermissions = [
    {
      role: 'Super Admin',
      usersCount: 2,
      badge: 'danger',
      description: 'System configuration, financial audit approval, user role management, system security',
      permissions: ['Manage Users', 'Access Financial Audits', 'Configure System', 'Manage All Modules', 'Export Full Data'],
    },
    {
      role: 'Admin',
      usersCount: 8,
      badge: 'primary',
      description: 'Member records, event operations, store catalog, announcements, routine chapter management',
      permissions: ['Manage Members', 'Create Events', 'Broadcast Announcements', 'Manage Orders', 'Generate Reports'],
    },
    {
      role: 'Treasurer',
      usersCount: 3,
      badge: 'success',
      description: 'Financial ledger, budget allocations, disbursements, income reconciliation, treasury statements',
      permissions: ['Record Income', 'Log Expenses', 'Disburse Funds', 'Reconcile Accounts', 'Export Statements'],
    },
    {
      role: 'Event Manager',
      usersCount: 6,
      badge: 'info',
      description: 'Event production, venue scheduling, ticket passes, attendee check-in, volunteer coordination',
      permissions: ['Schedule Venues', 'Issue Tickets', 'Scan QR Passes', 'Oversee Rosters', 'Track Attendance'],
    },
    {
      role: 'Volunteer',
      usersCount: 64,
      badge: 'warning',
      description: 'Committee assignments, task checklists, shift check-in, hours logging, operational support',
      permissions: ['Complete Assigned Tasks', 'View Shift Schedule', 'Log Service Hours', 'Assist Event Staff'],
    },
    {
      role: 'Member',
      usersCount: 1165,
      badge: 'secondary',
      description: 'Digital membership pass, discounted event tickets, club merchandise purchases, public announcements',
      permissions: ['View Membership Pass', 'Buy Tickets', 'Order Merchandise', 'Participate in Elections'],
    },
  ];

  return (
    <div className="animate-fade-in pb-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', path: '/super-admin/dashboard' }, { label: 'Roles & Permissions', active: true }]} />
          <h2 className="fs-3 fw-bold text-dark mb-1">Access Control & Role Permissions</h2>
          <p className="text-muted small mb-0">Role-based access matrix and permission boundaries</p>
        </div>
        <button
          type="button"
          className="btn btn-cf-primary"
          onClick={() => showSuccessToast('Custom role builder opened')}
        >
          <i className="bi bi-shield-plus" /> Create Custom Role
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Total Roles" value="6 Active" trendText="System default roles" trendDirection="neutral" icon="bi-shield-lock-fill" color="primary" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Super Admins" value="2" trendText="Faculty & Executive" trendDirection="neutral" icon="bi-key-fill" color="danger" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Assigned Users" value="1,248" trendText="100% role coverage" trendDirection="up" icon="bi-people-fill" color="success" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Permission Rules" value="24" trendText="Strict least-privilege" trendDirection="up" icon="bi-check2-all" color="info" />
        </div>
      </div>

      <div className="row g-4">
        {rolePermissions.map((item) => (
          <div key={item.role} className="col-12 col-md-6 col-xl-4">
            <div className="cf-card p-4 h-100 d-flex flex-column justify-content-between" style={{ borderRadius: '12px' }}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className={`badge bg-${item.badge} text-white px-2.5 py-1 text-xs`}>
                    {item.role}
                  </span>
                  <span className="text-muted text-xs">{item.usersCount} Assigned</span>
                </div>
                <p className="text-secondary small mb-3">{item.description}</p>
                <div className="mb-3">
                  <span className="text-xs fw-bold text-dark text-uppercase d-block mb-1.5" style={{ fontSize: '0.65rem' }}>
                    Privileges:
                  </span>
                  <div className="d-flex flex-wrap gap-1">
                    {item.permissions.map((perm, pIdx) => (
                      <span key={pIdx} className="badge bg-light text-secondary border text-xs">
                        <i className="bi bi-check text-success me-0.5" />
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-top pt-3 d-flex align-items-center justify-content-between mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-light border text-xs"
                  onClick={() => showSuccessToast(`Editing permissions for ${item.role}`)}
                >
                  Edit Permissions
                </button>
                <span className="text-xs text-muted">System Level</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roles;
