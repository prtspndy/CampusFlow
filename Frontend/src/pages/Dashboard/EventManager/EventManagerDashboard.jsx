import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../../components/Cards/StatCard';
import Breadcrumb from '../../../components/Cards/Breadcrumb';
import Loader from '../../../components/Loader/Loader';
import { dashboardService } from '../../../services/dashboardService';
import { showSuccessToast } from '../../../components/Modal/confirmDialog';

const EventManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await dashboardService.getEventManagerDashboard();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return <Loader text="Loading Event Production Hub..." fullScreen={false} />;
  }

  return (
    <div className="event-manager-dashboard animate-fade-in pb-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'CampusFlow', path: '/event-manager/dashboard' },
              { label: 'Event Manager', active: true },
            ]}
          />
          <h2 className="fs-3 fw-bold text-dark mb-1">Event Director & Production Hub</h2>
          <p className="text-muted small mb-0">
            Venue management, ticketing tiers, real-time check-in, and attendee capacity
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/attendance" className="btn btn-cf-outline">
            <i className="bi bi-qr-code-scan text-secondary" />
            <span>QR Scanner</span>
          </Link>
          <Link to="/events" className="btn btn-cf-primary">
            <i className="bi bi-calendar-plus" />
            <span>New Event</span>
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

      {/* Event Production Schedule & Capacity Tracker */}
      <div className="cf-card p-4 mb-4" style={{ borderRadius: '12px' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <div>
            <h5 className="fs-6 fw-bold mb-0 text-dark">Active Event Milestones & Capacity Tracker</h5>
            <p className="text-muted small mb-0">Ticket sales velocity against venue capacity limit</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-cf-outline"
            onClick={() => showSuccessToast('Attendee manifests exported as CSV')}
          >
            <i className="bi bi-download me-1" /> Export Roster
          </button>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Date & Schedule</th>
                <th>Venue Location</th>
                <th>Capacity Sold</th>
                <th>Ticket Pricing</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((evt) => {
                const percent = Math.round((evt.ticketsSold / evt.capacity) * 100);
                return (
                  <tr key={evt.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={evt.image}
                          alt={evt.title}
                          className="rounded-2"
                          style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                        />
                        <div>
                          <span className="fw-bold text-dark text-xs d-block">{evt.title}</span>
                          <span className="text-muted text-xs">{evt.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary bg-opacity-10 text-primary text-xs">
                        {evt.category}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs fw-semibold d-block text-dark">{evt.date}</span>
                      <span className="text-muted text-xs">{evt.time}</span>
                    </td>
                    <td className="text-xs text-secondary">
                      <i className="bi bi-geo-alt text-muted me-1" />
                      {evt.location}
                    </td>
                    <td style={{ minWidth: '140px' }}>
                      <div className="d-flex align-items-center justify-content-between text-xs mb-1">
                        <span className="fw-semibold text-dark">{evt.ticketsSold}/{evt.capacity}</span>
                        <span className="text-muted">{percent}%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${percent >= 90 ? 'bg-danger' : percent >= 75 ? 'bg-warning' : 'bg-primary'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-xs">
                      <span className="fw-semibold text-success">${evt.memberPrice}</span>
                      <span className="text-muted"> / ${evt.regularPrice} reg</span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border p-1 rounded-2 text-primary"
                        onClick={() => showSuccessToast(`Opening check-in for ${evt.title}`)}
                        title="Open Check-in"
                      >
                        <i className="bi bi-qr-code-scan" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Check-in Simulator Card */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <h5 className="fs-6 fw-bold mb-1 text-dark">Live Check-in Desk</h5>
            <p className="text-muted small mb-3">Quickly check in ticket holders by student ID or pass code</p>
            <div className="input-group mb-3">
              <input
                type="text"
                className="cf-input"
                placeholder="Scan QR or enter Student ID (e.g. STU-94021)..."
              />
              <button
                type="button"
                className="btn btn-cf-primary px-3"
                onClick={() => showSuccessToast('Ticket verified! Student Elena Vance checked in.')}
              >
                Verify & Check In
              </button>
            </div>
            <div className="p-3 bg-light rounded-3 text-xs text-secondary border">
              <i className="bi bi-info-circle text-primary me-1" />
              Connected to camera scanner. Optical recognition active for mobile Apple/Google Wallet passes.
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <h5 className="fs-6 fw-bold mb-1 text-dark">Volunteer Event Assignments</h5>
            <p className="text-muted small mb-3">Staff assigned to upcoming weekend events</p>
            <div className="d-flex align-items-center justify-content-between p-2.5 border rounded-3 mb-2 bg-light bg-opacity-40">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-badge text-primary fs-5" />
                <div>
                  <span className="fw-semibold text-dark text-xs d-block">Spring Gala Stage Crew</span>
                  <span className="text-muted text-xs">6 Volunteers Assigned</span>
                </div>
              </div>
              <span className="badge bg-success bg-opacity-10 text-success text-xs">Confirmed</span>
            </div>
            <div className="d-flex align-items-center justify-content-between p-2.5 border rounded-3 bg-light bg-opacity-40">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-badge text-info fs-5" />
                <div>
                  <span className="fw-semibold text-dark text-xs d-block">Campus Hackathon Logistics</span>
                  <span className="text-muted text-xs">8 Volunteers Assigned</span>
                </div>
              </div>
              <span className="badge bg-warning bg-opacity-10 text-warning text-xs">2 Slots Open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagerDashboard;
