import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../../components/Cards/StatCard';
import Breadcrumb from '../../../components/Cards/Breadcrumb';
import Loader from '../../../components/Loader/Loader';
import { dashboardService } from '../../../services/dashboardService';
import { showSuccessToast } from '../../../components/Modal/confirmDialog';

const VolunteerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await dashboardService.getVolunteerDashboard();
      setData(res);
      setTasks(res.tasks || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
          showSuccessToast(`Task "${t.title}" marked as ${nextStatus}`);
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  if (loading || !data) {
    return <Loader text="Loading Volunteer Workspace..." fullScreen={false} />;
  }

  const shifts = [
    {
      id: 'SH-01',
      event: 'Spring Gala 2026: Celestial Odyssey',
      role: 'Guest Welcome & Red Carpet Check-in',
      date: 'Sat, Apr 18, 2026',
      time: '6:30 PM - 9:30 PM (3 hrs)',
      location: 'Grand Ballroom, Skyline Union',
      supervisor: 'Sophia Patel (Event Director)',
      status: 'Confirmed',
    },
    {
      id: 'SH-02',
      event: 'Campus Hackathon 2026',
      role: 'Participant Registration & Badge Desk',
      date: 'Sat, Apr 25, 2026',
      time: '8:30 AM - 1:00 PM (4.5 hrs)',
      location: 'Engineering Hub Lab 102',
      supervisor: 'Alex Rivera (President)',
      status: 'Upcoming',
    },
    {
      id: 'SH-03',
      event: 'Study Night & Boba Social',
      role: 'Refreshment Setup & Catering Logistics',
      date: 'Wed, May 06, 2026',
      time: '5:00 PM - 8:00 PM (3 hrs)',
      location: 'Student Lounge B',
      supervisor: 'Aisha Al-Mansoor',
      status: 'Upcoming',
    },
  ];

  return (
    <div className="volunteer-dashboard animate-fade-in pb-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'CampusFlow', path: '/volunteer/dashboard' },
              { label: 'Volunteer Workspace', active: true },
            ]}
          />
          <h2 className="fs-3 fw-bold text-dark mb-1">Volunteer & Ambassador Portal</h2>
          <p className="text-muted small mb-0">
            Track your assigned committee tasks, confirmed event shifts, and volunteer service hours
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-cf-outline"
            onClick={() => showSuccessToast('Volunteer hours log submitted for review!')}
          >
            <i className="bi bi-clock-history text-secondary" />
            <span>Log Service Hours</span>
          </button>
          <Link to="/tasks" className="btn btn-cf-primary">
            <i className="bi bi-check2-square" />
            <span>All Tasks</span>
          </Link>
        </div>
      </div>

      {/* 3 Required Cards */}
      <div className="row g-3 mb-4">
        {data.cards.map((card, idx) => (
          <div key={idx} className="col-12 col-md-4">
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

      {/* Main Grid: Assigned Tasks Checklist & My Shift Schedule */}
      <div className="row g-4 mb-4">
        {/* Assigned Tasks Checklist */}
        <div className="col-12 col-lg-7">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fs-6 fw-bold mb-0 text-dark">My Assigned Committee Tasks</h5>
                <p className="text-muted small mb-0">Click checkboxes to update your progress</p>
              </div>
              <span className="badge bg-primary bg-opacity-10 text-primary text-xs">
                {tasks.filter((t) => t.status === 'Completed').length}/{tasks.length} Completed
              </span>
            </div>

            <div className="d-flex flex-column gap-2.5">
              {tasks.map((task) => {
                const isDone = task.status === 'Completed';
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-3 border transition-all d-flex align-items-center justify-content-between gap-3 ${
                      isDone
                        ? 'bg-light bg-opacity-50 border-light-subtle text-muted'
                        : 'bg-white border-light-subtle shadow-xs'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0 cursor-pointer"
                        style={{ width: '18px', height: '18px' }}
                        checked={isDone}
                        onChange={() => toggleTask(task.id)}
                      />
                      <div>
                        <span
                          className={`fw-semibold text-xs d-block ${
                            isDone ? 'text-decoration-line-through text-muted' : 'text-dark'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="d-flex align-items-center gap-2 mt-0.5 text-xs text-muted">
                          <span>Due: {task.dueDate}</span>
                          <span>•</span>
                          <span>{task.category || 'Event Committee'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={`badge text-xs ${
                          task.priority === 'High'
                            ? 'bg-danger bg-opacity-10 text-danger'
                            : task.priority === 'Medium'
                            ? 'bg-warning bg-opacity-10 text-warning'
                            : 'bg-info bg-opacity-10 text-info'
                        }`}
                      >
                        {task.priority || 'Normal'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* My Shift Schedule */}
        <div className="col-12 col-lg-5" id="schedule">
          <div className="cf-card p-4 h-100" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h5 className="fs-6 fw-bold mb-0 text-dark">My Upcoming Shifts</h5>
                <p className="text-muted small mb-0">Confirmed event staffing calendar</p>
              </div>
              <span className="badge bg-success bg-opacity-10 text-success text-xs">
                10.5 Total Hrs
              </span>
            </div>

            <div className="d-flex flex-column gap-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-3 rounded-3 border border-light-subtle bg-light bg-opacity-30"
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="badge bg-primary bg-opacity-10 text-primary text-xs">
                      {shift.role}
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success text-xs">
                      {shift.status}
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark text-xs mb-1">{shift.event}</h6>
                  <div className="text-muted text-xs d-flex flex-column gap-0.5">
                    <div><i className="bi bi-clock me-1 text-primary" />{shift.date} • {shift.time}</div>
                    <div><i className="bi bi-geo-alt me-1 text-danger" />{shift.location}</div>
                    <div><i className="bi bi-person me-1 text-secondary" />Supervisor: {shift.supervisor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
