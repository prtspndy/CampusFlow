import React from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import StatCard from '../../components/Cards/StatCard';
import Table from '../../components/Tables/Table';
import { DEMO_USERS } from '../../constants/roles';
import { showSuccessToast } from '../../components/Modal/confirmDialog';

const Users = () => {
  const columns = [
    {
      key: 'name',
      title: 'User Profile',
      render: (_, row) => (
        <div className="d-flex align-items-center gap-2">
          <img src={row.avatar} alt={row.name} className="rounded-circle border" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
          <div>
            <span className="fw-bold text-dark text-xs d-block">{row.name}</span>
            <span className="text-muted text-xs">{row.email}</span>
          </div>
        </div>
      ),
    },
    { key: 'studentId', title: 'Student/Staff ID' },
    { key: 'department', title: 'Department' },
    {
      key: 'role',
      title: 'Assigned Role',
      render: (val) => (
        <span className={`badge bg-${val === 'Super Admin' ? 'danger' : val === 'Treasurer' ? 'success' : 'primary'} text-xs`}>
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: () => <span className="cf-badge cf-badge-success text-xs">Active</span>,
    },
  ];

  return (
    <div className="animate-fade-in pb-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', path: '/super-admin/dashboard' }, { label: 'System Users', active: true }]} />
          <h2 className="fs-3 fw-bold text-dark mb-1">User Accounts & Credentials</h2>
          <p className="text-muted small mb-0">Manage registered officers, board members, faculty advisors, and students</p>
        </div>
        <button
          type="button"
          className="btn btn-cf-primary"
          onClick={() => showSuccessToast('Create user dialog opened')}
        >
          <i className="bi bi-person-plus-fill" /> Add New User
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Total Accounts" value="1,254" trendText="All registered users" trendDirection="up" icon="bi-people-fill" color="primary" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Active Officers" value="24" trendText="Board & committee leads" trendDirection="neutral" icon="bi-award-fill" color="info" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Faculty Advisors" value="6" trendText="Department liaisons" trendDirection="neutral" icon="bi-mortarboard-fill" color="warning" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Security Score" value="99.2%" trendText="2FA enrollment high" trendDirection="up" icon="bi-shield-check" color="success" />
        </div>
      </div>

      <div className="cf-card p-4" style={{ borderRadius: '12px' }}>
        <h5 className="fs-6 fw-bold mb-3 text-dark">Administrative & Executive Users</h5>
        <Table columns={columns} data={DEMO_USERS} searchKey="name" searchPlaceholder="Search users by name..." />
      </div>
    </div>
  );
};

export default Users;
