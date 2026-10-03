import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../../components/Cards/StatCard';
import Breadcrumb from '../../../components/Cards/Breadcrumb';
import Loader from '../../../components/Loader/Loader';
import { useAuth } from '../../../context/AuthContext';
import { dashboardService } from '../../../services/dashboardService';
import { showSuccessToast } from '../../../components/Modal/confirmDialog';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await dashboardService.getMemberDashboard();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return <Loader text="Loading Member Portal..." fullScreen={false} />;
  }

  const memberTickets = [
    {
      id: 'TCK-2026-8812',
      event: 'Spring Gala 2026: Celestial Odyssey',
      date: 'Sat, Apr 18, 2026 • 7:00 PM',
      venue: 'Grand Ballroom, Skyline Union',
      tier: 'Pro Member Free Pass',
      seat: 'Table 14, Seat 2',
      qr: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=CF-GALA-8812',
    },
    {
      id: 'TCK-2026-9041',
      event: 'Campus Hackathon 2026',
      date: 'Sat, Apr 25, 2026 • 9:00 AM',
      venue: 'Engineering Hub Lab 102',
      tier: 'General Participant',
      seat: 'Team Area B',
      qr: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=CF-HACK-9041',
    },
  ];

  return (
    <div className="member-dashboard animate-fade-in pb-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'CampusFlow', path: '/member/dashboard' },
              { label: 'Member Portal', active: true },
            ]}
          />
          <h2 className="fs-3 fw-bold text-dark mb-1">Welcome back, {user?.name || 'Member'}!</h2>
          <p className="text-muted small mb-0">
            Access your student membership card, active event tickets, and association store orders
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/merchandise" className="btn btn-cf-outline">
            <i className="bi bi-bag-heart text-secondary" />
            <span>Club Store</span>
          </Link>
          <Link to="/events" className="btn btn-cf-primary">
            <i className="bi bi-ticket-detailed" />
            <span>Browse Events</span>
          </Link>
        </div>
      </div>

      {/* 4 Required Cards */}
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

      {/* Main Grid: Digital Membership Card & Active Passes */}
      <div className="row g-4 mb-4">
        {/* Digital Membership ID Card */}
        <div className="col-12 col-lg-5">
          <div
            className="cf-card p-4 text-white position-relative overflow-hidden shadow-md"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
            }}
          >
            {/* Background decoration */}
            <div
              className="position-absolute rounded-circle"
              style={{
                width: '260px',
                height: '260px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                top: '-80px',
                right: '-80px',
              }}
            />

            <div className="d-flex align-items-center justify-content-between mb-4 position-relative">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-mortarboard-fill fs-4" />
                <span className="fw-bold tracking-wide">SKYLINE SA MEMBER</span>
              </div>
              <span className="badge bg-white bg-opacity-25 text-white px-2.5 py-1 text-xs rounded-pill">
                VALID 2025-2026
              </span>
            </div>

            <div className="d-flex align-items-center gap-3 mb-4 position-relative">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=256'}
                alt="Member"
                className="rounded-3 border border-2 border-white shadow-sm"
                style={{ width: '64px', height: '64px', objectFit: 'cover' }}
              />
              <div>
                <h4 className="fw-bold mb-0 text-white fs-5">{user?.name || 'Elena Vance'}</h4>
                <div className="text-white-50 text-xs">{user?.department || 'Biochemistry & Pre-Med'}</div>
                <div className="badge bg-white text-primary mt-1 text-xs fw-bold">
                  {user?.role || 'Active Member'}
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-3 border-top border-white border-opacity-25 position-relative">
              <div>
                <span className="d-block text-white-50 text-xs">STUDENT ID</span>
                <span className="fw-bold font-monospace fs-6">{user?.studentId || 'STU-95104'}</span>
              </div>
              <div className="text-end">
                <span className="d-block text-white-50 text-xs">TIER STATUS</span>
                <span className="fw-bold text-white fs-6">Pro Lifetime</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Purchased Tickets */}
        <div className="col-12 col-lg-7">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fs-6 fw-bold mb-0 text-dark">My Active Event Tickets</h5>
                <p className="text-muted small mb-0">Present QR pass at venue admission desk</p>
              </div>
              <span className="badge bg-success bg-opacity-10 text-success text-xs">
                {memberTickets.length} Confirmed
              </span>
            </div>

            <div className="d-flex flex-column gap-3">
              {memberTickets.map((tck) => (
                <div
                  key={tck.id}
                  className="p-3 rounded-3 border border-light-subtle bg-white shadow-xs d-flex flex-column flex-sm-row justify-content-between gap-3 align-items-sm-center"
                >
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-primary bg-opacity-10 text-primary text-xs">{tck.tier}</span>
                      <span className="text-muted text-xs font-monospace">{tck.id}</span>
                    </div>
                    <h6 className="fw-bold text-dark text-xs mb-1">{tck.event}</h6>
                    <div className="text-muted text-xs d-flex flex-column gap-0.5">
                      <div><i className="bi bi-clock me-1 text-primary" />{tck.date}</div>
                      <div><i className="bi bi-geo-alt me-1 text-danger" />{tck.venue} • {tck.seat}</div>
                    </div>
                  </div>

                  <div className="d-flex flex-column align-items-center justify-content-center bg-light p-2 rounded-2 border">
                    <img
                      src={tck.qr}
                      alt="Ticket QR"
                      style={{ width: '64px', height: '64px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-xs text-primary mt-1 text-decoration-none"
                      onClick={() => showSuccessToast(`Downloaded pass: ${tck.id}`)}
                    >
                      Save Pass
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Available Events to Join */}
      <div className="cf-card p-4" style={{ borderRadius: '12px' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <div>
            <h5 className="fs-6 fw-bold mb-0 text-dark">Upcoming Campus Events</h5>
            <p className="text-muted small mb-0">Exclusive ticket pricing for active organization members</p>
          </div>
          <Link to="/events" className="btn btn-sm btn-cf-outline">
            View Full Calendar
          </Link>
        </div>

        <div className="row g-3">
          {data.upcomingEvents.map((evt) => (
            <div key={evt.id} className="col-12 col-md-6 col-lg-4">
              <div className="cf-card h-100 overflow-hidden border border-light-subtle d-flex flex-column justify-content-between">
                <div style={{ height: '140px', overflow: 'hidden' }}>
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                  <div>
                    <span className="badge bg-primary bg-opacity-10 text-primary text-xs mb-1">
                      {evt.category}
                    </span>
                    <h6 className="fw-bold text-dark text-xs mb-1">{evt.title}</h6>
                    <div className="text-muted text-xs mb-2">
                      <i className="bi bi-calendar-event me-1" /> {evt.date} • {evt.time}
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-2">
                    <div>
                      <span className="fw-bold text-success text-sm">${evt.memberPrice}</span>
                      <span className="text-muted text-xs"> (Member rate)</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-cf-primary py-1 px-2.5 text-xs"
                      onClick={() => showSuccessToast(`Reserved ticket for ${evt.title}`)}
                    >
                      RSVP / Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
