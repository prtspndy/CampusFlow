import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/Cards/StatCard';
import ContentCard from '../../components/Cards/ContentCard';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import ChartCard from '../../components/Charts/ChartCard';
import StatusChip from '../../components/Cards/StatusChip';
import Avatar from '../../components/Cards/Avatar';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import {
  MOCK_DASHBOARD_STATS,
  MOCK_CHART_DATA,
  MOCK_EVENTS,
  INITIAL_ORG_INFO,
} from '../../constants/mockData';
import { showSuccessToast } from '../../components/Modal/confirmDialog';

const Dashboard = () => {
  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState(null); // 'member' | 'announcement' | 'expense' | null
  const [quickMemberName, setQuickMemberName] = useState('');
  const [quickMemberEmail, setQuickMemberEmail] = useState('');
  const [quickAnnounceTitle, setQuickAnnounceTitle] = useState('');
  const [quickExpenseAmount, setQuickExpenseAmount] = useState('');

  const stats = MOCK_DASHBOARD_STATS;

  const handleQuickMemberSubmit = (e) => {
    e.preventDefault();
    showSuccessToast(`Member ${quickMemberName || 'Student'} enrolled successfully!`);
    setActiveModal(null);
    setQuickMemberName('');
    setQuickMemberEmail('');
  };

  const handleQuickAnnounceSubmit = (e) => {
    e.preventDefault();
    showSuccessToast(`Announcement "${quickAnnounceTitle}" broadcasted to all channels!`);
    setActiveModal(null);
    setQuickAnnounceTitle('');
  };

  const handleQuickExpenseSubmit = (e) => {
    e.preventDefault();
    showSuccessToast(`Expense of $${quickExpenseAmount || '50'} recorded into club ledger!`);
    setActiveModal(null);
    setQuickExpenseAmount('');
  };

  return (
    <div className="dashboard-page">
      {/* Page Header & Welcome Banner */}
      <Breadcrumb
        items={[{ label: 'Dashboard' }]}
        title={`${INITIAL_ORG_INFO.shortName} Executive Overview`}
        actionButton={
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="bi-megaphone"
              onClick={() => setActiveModal('announcement')}
            >
              Post Announcement
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="bi-receipt"
              onClick={() => setActiveModal('expense')}
            >
              Record Expense
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="bi-person-plus-fill"
              onClick={() => setActiveModal('member')}
            >
              Add Member
            </Button>
          </div>
        }
      />

      {/* Top Banner Notice */}
      <div className="cf-card p-3 p-md-4 mb-4 bg-white border-start border-4 border-primary shadow-xs">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary flex-shrink-0"
              style={{ width: '44px', height: '44px' }}
            >
              <i className="bi bi-stars fs-4" />
            </div>
            <div>
              <h5 className="fs-6 fw-bold mb-0 text-dark">
                {INITIAL_ORG_INFO.activeSemester} Mid-Semester Milestone
              </h5>
              <p className="text-muted small mb-0">
                1,248 registered students • Spring Gala ticket sales are currently live at 86% capacity.
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/reports" className="btn btn-sm btn-light border text-secondary">
              View Semester Audit <i className="bi bi-arrow-right ms-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* 10 Dashboard Key Stat Cards Grid */}
      <div className="row g-3 mb-4">
        {/* 1. Total Members */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Members"
            value={stats.totalMembers.value}
            icon="bi-people-fill"
            change={stats.totalMembers.change}
            trend={stats.totalMembers.trend}
            color="primary"
          />
        </div>

        {/* 2. Active Memberships */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Active Memberships"
            value={stats.activeMemberships.value}
            icon="bi-award-fill"
            change={stats.activeMemberships.change}
            trend={stats.activeMemberships.trend}
            color="success"
          />
        </div>

        {/* 3. Upcoming Events */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents.value}
            icon="bi-calendar-event-fill"
            change={stats.upcomingEvents.change}
            trend={stats.upcomingEvents.trend}
            color="secondary"
          />
        </div>

        {/* 4. Ticket Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Ticket Sales"
            value={stats.ticketSales.value}
            icon="bi-ticket-perforated-fill"
            change={stats.ticketSales.change}
            trend={stats.ticketSales.trend}
            color="primary"
          />
        </div>

        {/* 5. Merchandise Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Merchandise Sales"
            value={stats.merchandiseSales.value}
            icon="bi-bag-check-fill"
            change={stats.merchandiseSales.change}
            trend={stats.merchandiseSales.trend}
            color="secondary"
          />
        </div>

        {/* 6. Income */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Income"
            value={stats.income.value}
            icon="bi-graph-up-arrow"
            change={stats.income.change}
            trend={stats.income.trend}
            color="success"
          />
        </div>

        {/* 7. Expenses */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Expenses"
            value={stats.expenses.value}
            icon="bi-credit-card-2-front-fill"
            change={stats.expenses.change}
            trend={stats.expenses.trend}
            color="danger"
          />
        </div>

        {/* 8. Current Balance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Current Balance"
            value={stats.currentBalance.value}
            icon="bi-safe2-fill"
            change={stats.currentBalance.change}
            trend={stats.currentBalance.trend}
            color="success"
          />
        </div>

        {/* 9. Pending Tasks */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks.value}
            icon="bi-check2-circle"
            change={stats.pendingTasks.change}
            trend={stats.pendingTasks.trend}
            color="warning"
          />
        </div>

        {/* 10. Recent Announcements */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Announcements"
            value={stats.recentAnnouncements.value}
            icon="bi-megaphone-fill"
            change={stats.recentAnnouncements.change}
            trend={stats.recentAnnouncements.trend}
            color="secondary"
          />
        </div>
      </div>

      {/* 4 Interactive Charts Section */}
      <div className="row g-3 mb-4">
        {/* Chart 1: Monthly Revenue */}
        <div className="col-12 col-lg-6">
          <ChartCard
            title="Monthly Revenue & Cash Flow"
            subtitle="Income vs operational expenses over 6 months"
            type="line"
            data={MOCK_CHART_DATA.monthlyRevenue}
            badgeText="Cash Positive"
            badgeVariant="success"
          />
        </div>

        {/* Chart 2: Membership Growth */}
        <div className="col-12 col-lg-6">
          <ChartCard
            title="Membership Growth by Term"
            subtitle="Total registered student members over academic terms"
            type="bar"
            data={MOCK_CHART_DATA.membershipGrowth}
            badgeText="+18% YoY"
            badgeVariant="primary"
          />
        </div>

        {/* Chart 3: Event Attendance */}
        <div className="col-12 col-lg-6">
          <ChartCard
            title="Event Attendance Breakdown"
            subtitle="Actual verified student check-ins per event"
            type="bar"
            data={MOCK_CHART_DATA.eventAttendance}
            badgeText="92% Turnout"
            badgeVariant="secondary"
          />
        </div>

        {/* Chart 4: Expenses by Category */}
        <div className="col-12 col-lg-6">
          <ChartCard
            title="Expense Allocation"
            subtitle="Distribution of semester budget across committees"
            type="doughnut"
            data={MOCK_CHART_DATA.expensesBreakdown}
            badgeText="Audited"
            badgeVariant="warning"
          />
        </div>
      </div>

      {/* Bottom Row: Upcoming Events & Recent Activity Timeline */}
      <div className="row g-3">
        {/* Upcoming Events Card */}
        <div className="col-12 col-lg-7">
          <ContentCard
            title="Upcoming Campus Events"
            subtitle="Tickets and live registration counters"
            icon="bi-calendar3"
            actions={
              <Link to="/events" className="btn btn-sm btn-link text-primary text-decoration-none">
                All Events <i className="bi bi-chevron-right" />
              </Link>
            }
          >
            <div className="d-flex flex-column gap-3">
              {MOCK_EVENTS.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-3 border border-light-subtle d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 hover-bg-light transition-all"
                >
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={evt.image}
                      alt={evt.title}
                      className="rounded-3 object-fit-cover"
                      style={{ width: '56px', height: '56px' }}
                    />
                    <div>
                      <h6 className="mb-1 fw-bold text-dark">{evt.title}</h6>
                      <div className="d-flex flex-wrap align-items-center gap-2 text-xs text-muted">
                        <span>
                          <i className="bi bi-clock me-1" />
                          {evt.date} • {evt.time}
                        </span>
                        <span>•</span>
                        <span>
                          <i className="bi bi-geo-alt me-1" />
                          {evt.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-3">
                    <div className="text-end">
                      <span className="text-xs text-muted d-block">Tickets</span>
                      <strong className="text-primary text-sm">
                        {evt.ticketsSold} / {evt.capacity}
                      </strong>
                    </div>
                    <StatusChip status={evt.status} />
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>

        {/* Recent Activity Timeline Card */}
        <div className="col-12 col-lg-5">
          <ContentCard
            title="Recent Activity Timeline"
            subtitle="Live audit trail of student actions"
            icon="bi-activity"
            actions={
              <Link to="/reports" className="btn btn-sm btn-link text-primary text-decoration-none">
                Logs <i className="bi bi-chevron-right" />
              </Link>
            }
          >
            <div className="position-relative ps-3">
              {/* Timeline vertical bar */}
              <div
                className="position-absolute top-0 bottom-0 start-0 bg-light-subtle ms-3"
                style={{ width: '2px' }}
              />

              <div className="d-flex flex-column gap-3">
                <div className="d-flex gap-3 position-relative">
                  <div
                    className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', fontSize: '0.75rem', zIndex: 2 }}
                  >
                    <i className="bi bi-check-lg" />
                  </div>
                  <div>
                    <p className="mb-0 text-sm fw-semibold text-dark">
                      Spring Gala Ticket sold to Elena Vance
                    </p>
                    <span className="text-muted text-xs">15 minutes ago • Member Price ($15.00)</span>
                  </div>
                </div>

                <div className="d-flex gap-3 position-relative">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', fontSize: '0.75rem', zIndex: 2 }}
                  >
                    <i className="bi bi-person-plus-fill" />
                  </div>
                  <div>
                    <p className="mb-0 text-sm fw-semibold text-dark">
                      New Member registration: Tyler Washington
                    </p>
                    <span className="text-muted text-xs">45 minutes ago • Psychology Dept</span>
                  </div>
                </div>

                <div className="d-flex gap-3 position-relative">
                  <div
                    className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', fontSize: '0.75rem', zIndex: 2 }}
                  >
                    <i className="bi bi-receipt" />
                  </div>
                  <div>
                    <p className="mb-0 text-sm fw-semibold text-dark">
                      Reimbursement approved: Aisha Al-Mansoor ($64.20)
                    </p>
                    <span className="text-muted text-xs">2 hours ago • Bake Sale supplies</span>
                  </div>
                </div>

                <div className="d-flex gap-3 position-relative">
                  <div
                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', fontSize: '0.75rem', zIndex: 2 }}
                  >
                    <i className="bi bi-bag-check" />
                  </div>
                  <div>
                    <p className="mb-0 text-sm fw-semibold text-dark">
                      Varsity Hoodie Order ORD-8821 fulfilled
                    </p>
                    <span className="text-muted text-xs">Yesterday • Picked up by Sophia Patel</span>
                  </div>
                </div>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>

      {/* Quick Add Member Modal */}
      <Modal
        isOpen={activeModal === 'member'}
        onClose={() => setActiveModal(null)}
        title="Quick Member Enrollment"
        subtitle="Register student directly at the campus welcome table"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleQuickMemberSubmit}>
              Enroll Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleQuickMemberSubmit}>
          <InputField
            label="Full Name"
            placeholder="Student Name"
            value={quickMemberName}
            onChange={(e) => setQuickMemberName(e.target.value)}
            required
          />
          <InputField
            label="Student Email"
            type="email"
            placeholder="student@skyline.edu"
            value={quickMemberEmail}
            onChange={(e) => setQuickMemberEmail(e.target.value)}
            required
          />
          <SelectField
            label="Membership Tier"
            options={['Basic Member ($15)', 'Pro Member ($35)', 'Lifetime Patron ($75)']}
          />
        </form>
      </Modal>

      {/* Quick Announcement Modal */}
      <Modal
        isOpen={activeModal === 'announcement'}
        onClose={() => setActiveModal(null)}
        title="Broadcast Announcement"
        subtitle="Instantly publish news to members and student groups"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleQuickAnnounceSubmit}>
              Publish Broadcast
            </Button>
          </>
        }
      >
        <form onSubmit={handleQuickAnnounceSubmit}>
          <InputField
            label="Headline / Title"
            placeholder="e.g. Venue Change for Friday Meeting"
            value={quickAnnounceTitle}
            onChange={(e) => setQuickAnnounceTitle(e.target.value)}
            required
          />
          <SelectField
            label="Target Audience"
            options={['All Members (1,248)', 'Active Volunteers Only', 'Executive Board', 'Unpaid Members']}
          />
          <div className="mb-3">
            <label className="cf-label">Distribution Channels</label>
            <div className="d-flex gap-3 mt-1">
              <label className="form-check-label text-sm">
                <input type="checkbox" defaultChecked className="form-check-input me-1" /> CampusFlow App
              </label>
              <label className="form-check-label text-sm">
                <input type="checkbox" defaultChecked className="form-check-input me-1" /> WhatsApp Group
              </label>
              <label className="form-check-label text-sm">
                <input type="checkbox" defaultChecked className="form-check-input me-1" /> Email Digest
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Quick Expense Modal */}
      <Modal
        isOpen={activeModal === 'expense'}
        onClose={() => setActiveModal(null)}
        title="Record Club Expense"
        subtitle="Log an expense or volunteer reimbursement"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleQuickExpenseSubmit}>
              Save Expense
            </Button>
          </>
        }
      >
        <form onSubmit={handleQuickExpenseSubmit}>
          <InputField
            label="Expense Amount ($)"
            type="number"
            placeholder="e.g. 45.00"
            value={quickExpenseAmount}
            onChange={(e) => setQuickExpenseAmount(e.target.value)}
            required
          />
          <SelectField
            label="Expense Category"
            options={['Event Supplies', 'Food & Catering', 'Printing & Posters', 'Volunteer Reimbursement', 'Equipment Rental']}
          />
          <InputField
            label="Expense Description / Payee"
            placeholder="e.g. Tablecloths and decorations for Gala"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
