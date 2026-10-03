import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../../components/Cards/StatCard';
import Breadcrumb from '../../../components/Cards/Breadcrumb';
import Loader from '../../../components/Loader/Loader';
import { dashboardService } from '../../../services/dashboardService';
import { showSuccessToast } from '../../../components/Modal/confirmDialog';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await dashboardService.getAdminDashboard();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return <Loader text="Loading Admin Operations Dashboard..." fullScreen={false} />;
  }

  return (
    <div className="admin-dashboard animate-fade-in pb-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'CampusFlow', path: '/admin/dashboard' },
              { label: 'Admin Dashboard', active: true },
            ]}
          />
          <h2 className="fs-3 fw-bold text-dark mb-1">Chapter Administration</h2>
          <p className="text-muted small mb-0">
            Oversee membership management, programming schedules, store operations, and communications
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/announcements" className="btn btn-cf-outline">
            <i className="bi bi-megaphone text-secondary" />
            <span>Post Notice</span>
          </Link>
          <Link to="/events" className="btn btn-cf-primary">
            <i className="bi bi-calendar-plus" />
            <span>Manage Events</span>
          </Link>
        </div>
      </div>

      {/* 4 Required Dashboard Cards */}
      <div className="row g-3 mb-4">
        {data.cards.map((card, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title={card.label}
              value={card.value}
              trendText={card.change}
              trendDirection={card.trend}
              icon={card.icon}
              color={card.color}
            />
          </div>
        ))}
      </div>

      {/* Middle Row: Recent Members & Upcoming Events */}
      <div className="row g-4 mb-4">
        {/* Recent Members */}
        <div className="col-12 col-lg-7">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fs-6 fw-bold mb-0 text-dark">Recently Enrolled Members</h5>
                <p className="text-muted small mb-0">Newly approved student memberships</p>
              </div>
              <Link to="/members" className="btn btn-sm btn-cf-outline">
                View All Members <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>

            <div className="table-responsive">
              <table className="cf-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Major</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="rounded-circle border"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                          />
                          <div>
                            <span className="fw-semibold text-dark text-xs d-block">{member.name}</span>
                            <span className="text-muted text-xs">{member.studentId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs">{member.major}</td>
                      <td>
                        <span className="badge bg-light text-dark border text-xs">
                          {member.tier}
                        </span>
                      </td>
                      <td>
                        <span className={`cf-badge cf-badge-${member.status === 'Active' ? 'success' : 'neutral'} text-xs`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border p-1 rounded-2 text-secondary"
                          onClick={() => showSuccessToast(`Viewing record for ${member.name}`)}
                          title="View Profile"
                        >
                          <i className="bi bi-eye" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upcoming Events Overview */}
        <div className="col-12 col-lg-5">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fs-6 fw-bold mb-0 text-dark">Upcoming Events</h5>
                <p className="text-muted small mb-0">Scheduled calendar milestones</p>
              </div>
              <Link to="/events" className="small text-primary text-decoration-none fw-semibold">
                Calendar View
              </Link>
            </div>

            <div className="d-flex flex-column gap-3">
              {data.upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-3 border border-light-subtle bg-light bg-opacity-40 d-flex gap-3 align-items-center"
                >
                  <div
                    className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex flex-column align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '50px', height: '50px' }}
                  >
                    <span className="fw-bold fs-6 lh-1">{evt.date.split('-')[2]}</span>
                    <span className="text-uppercase text-xs fw-semibold">APR</span>
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <h6 className="fw-semibold text-dark text-xs mb-1 text-truncate">{evt.title}</h6>
                    <div className="text-muted text-xs d-flex align-items-center gap-2">
                      <span><i className="bi bi-geo-alt me-1" />{evt.location}</span>
                      <span>•</span>
                      <span>{evt.ticketsSold}/{evt.capacity} RSVPs</span>
                    </div>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success text-xs">
                    {evt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="cf-card p-4" style={{ borderRadius: '12px' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <div>
            <h5 className="fs-6 fw-bold mb-0 text-dark">Active Announcements & Broadcasts</h5>
            <p className="text-muted small mb-0">Public bulletins currently visible to members</p>
          </div>
          <Link to="/announcements" className="btn btn-sm btn-cf-outline">
            Create Announcement
          </Link>
        </div>

        <div className="row g-3">
          {data.announcements.map((item) => (
            <div key={item.id} className="col-12 col-md-4">
              <div className="p-3 rounded-3 border border-light-subtle bg-white h-100 d-flex flex-column justify-content-between shadow-xs">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary text-xs">
                      {item.category}
                    </span>
                    <span className="text-muted text-xs">{item.date}</span>
                  </div>
                  <h6 className="fw-bold text-dark text-sm mb-1">{item.title}</h6>
                  <p className="text-secondary small mb-2 text-truncate">{item.content}</p>
                </div>
                <div className="text-xs text-muted d-flex align-items-center justify-content-between border-top pt-2 mt-2">
                  <span>Author: {item.author}</span>
                  <span className="text-success"><i className="bi bi-eye me-1" />Published</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
