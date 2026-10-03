import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../../components/Cards/StatCard';
import ChartCard from '../../../components/Charts/ChartCard';
import Breadcrumb from '../../../components/Cards/Breadcrumb';
import Button from '../../../components/Buttons/Button';
import Loader from '../../../components/Loader/Loader';
import { dashboardService } from '../../../services/dashboardService';
import { showSuccessToast } from '../../../components/Modal/confirmDialog';

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await dashboardService.getSuperAdminDashboard();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return <Loader text="Loading Super Admin command center..." fullScreen={false} />;
  }

  // 1. Revenue Chart Data
  const revenueChartData = {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      {
        label: 'Gross Income ($)',
        data: [12400, 14200, 11800, 16900, 18450, 21200],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Operating Expenses ($)',
        data: [4200, 5100, 3900, 6200, 5970, 7100],
        borderColor: '#DC2626',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.35,
      },
    ],
  };

  // 2. Members Growth Chart Data
  const membersChartData = {
    labels: ['Freshmen', 'Sophomores', 'Juniors', 'Seniors', 'Grad Students', 'Alumni'],
    datasets: [
      {
        label: 'Registered Members',
        data: [380, 310, 290, 185, 55, 28],
        backgroundColor: '#0EA5E9',
        borderRadius: 6,
      },
    ],
  };

  // 3. Events Attendance Chart Data
  const eventsChartData = {
    labels: ['Galas & Socials', 'Hackathons', 'Workshops', 'Volunteer Drives', 'Athletics'],
    datasets: [
      {
        data: [420, 280, 210, 190, 148],
        backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="super-admin-dashboard animate-fade-in pb-4">
      {/* Top Breadcrumb & Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'CampusFlow', path: '/super-admin/dashboard' },
              { label: 'Super Admin', active: true },
            ]}
          />
          <h2 className="fs-3 fw-bold text-dark mb-1">Super Admin Executive Hub</h2>
          <p className="text-muted small mb-0">
            System-wide operational control, membership analytics, and organization governance
          </p>
        </div>

        {/* Quick Action Button Group */}
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-cf-outline"
            onClick={() => showSuccessToast('Executive audit report downloaded')}
          >
            <i className="bi bi-file-earmark-arrow-down text-secondary" />
            <span>Export Report</span>
          </button>
          <Link to="/events" className="btn btn-cf-primary">
            <i className="bi bi-plus-lg" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {/* 8 Required Dashboard Cards */}
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

      {/* 3 Required Charts */}
      <div className="row g-4 mb-4">
        {/* Chart 1: Revenue */}
        <div className="col-12 col-xl-5">
          <ChartCard
            title="Revenue vs Operational Expenses"
            subtitle="6-Month university treasury flow"
            type="line"
            data={revenueChartData}
            badgeText="Financial Health: Strong"
            badgeVariant="success"
            height={280}
          />
        </div>

        {/* Chart 2: Members Growth */}
        <div className="col-12 col-md-6 col-xl-4">
          <ChartCard
            title="Member Demographic Distribution"
            subtitle="Active enrollment by cohort"
            type="bar"
            data={membersChartData}
            badgeText="1,248 Total"
            badgeVariant="primary"
            height={280}
          />
        </div>

        {/* Chart 3: Events Attendance */}
        <div className="col-12 col-md-6 col-xl-3">
          <ChartCard
            title="Event Participation"
            subtitle="Attendees by category"
            type="doughnut"
            data={eventsChartData}
            badgeText="18 Events"
            badgeVariant="info"
            height={280}
          />
        </div>
      </div>

      {/* Bottom Section: Recent Activities & Quick Actions */}
      <div className="row g-4">
        {/* Recent Activities */}
        <div className="col-12 col-lg-8">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fs-6 fw-bold mb-0 text-dark">Recent System Activities</h5>
                <p className="text-muted small mb-0">Real-time audit log of operations across all chapters</p>
              </div>
              <span className="badge bg-light text-secondary border px-2.5 py-1 text-xs">
                Live Audit Stream
              </span>
            </div>

            <div className="list-group list-group-flush">
              {data.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="list-group-item px-0 py-3 border-bottom d-flex align-items-start gap-3 bg-transparent"
                >
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center text-white bg-${act.color} flex-shrink-0`}
                    style={{ width: '38px', height: '38px' }}
                  >
                    <i className={`bi ${act.icon} fs-6`} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0 text-sm fw-semibold text-dark">{act.title}</p>
                    <span className="text-muted text-xs">{act.time}</span>
                  </div>
                  <span className="badge bg-light border text-secondary text-xs text-uppercase">
                    {act.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & System Health */}
        <div className="col-12 col-lg-4">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <h5 className="fs-6 fw-bold mb-1 text-dark">Super Admin Quick Actions</h5>
            <p className="text-muted small mb-3">Execute high-priority governance commands</p>

            <div className="d-flex flex-column gap-2 mb-4">
              <Link
                to="/members"
                className="btn btn-cf-outline w-100 justify-content-start py-2.5 text-start"
              >
                <i className="bi bi-person-plus text-primary me-2 fs-5" />
                <div>
                  <div className="fw-semibold text-dark text-xs">Register New Member</div>
                  <div className="text-muted text-xs">Add student record manually</div>
                </div>
              </Link>

              <Link
                to="/finance"
                className="btn btn-cf-outline w-100 justify-content-start py-2.5 text-start"
              >
                <i className="bi bi-cash-stack text-success me-2 fs-5" />
                <div>
                  <div className="fw-semibold text-dark text-xs">Approve Disbursements</div>
                  <div className="text-muted text-xs">Review pending budget claims</div>
                </div>
              </Link>

              <Link
                to="/announcements"
                className="btn btn-cf-outline w-100 justify-content-start py-2.5 text-start"
              >
                <i className="bi bi-megaphone text-info me-2 fs-5" />
                <div>
                  <div className="fw-semibold text-dark text-xs">Campus Broadcast</div>
                  <div className="text-muted text-xs">Publish announcement to all members</div>
                </div>
              </Link>

              <Link
                to="/settings"
                className="btn btn-cf-outline w-100 justify-content-start py-2.5 text-start"
              >
                <i className="bi bi-shield-lock text-warning me-2 fs-5" />
                <div>
                  <div className="fw-semibold text-dark text-xs">Roles & Permissions</div>
                  <div className="text-muted text-xs">Configure access controls</div>
                </div>
              </Link>
            </div>

            {/* University Status pill */}
            <div className="p-3 bg-light rounded-3 border border-light-subtle">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-xs text-muted fw-semibold">Term Status</span>
                <span className="badge bg-success bg-opacity-10 text-success text-xs fw-bold">Online</span>
              </div>
              <div className="text-xs text-secondary">
                Spring 2026 Academic Session • Skyline University Student Union
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
