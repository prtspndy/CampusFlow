import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import StatCard from '../../components/Cards/StatCard';
import Table from '../../components/Tables/Table';
import { MOCK_EVENTS } from '../../constants/mockData';
import { showSuccessToast } from '../../components/Modal/confirmDialog';

const Tickets = () => {
  const [tickets] = useState([
    { id: 'TCK-1001', attendee: 'Alex Rivera', event: 'Spring Gala 2026', type: 'VIP Executive', price: '$25.00', status: 'Checked In', date: '2026-04-18' },
    { id: 'TCK-1002', attendee: 'Marcus Chen', event: 'Spring Gala 2026', type: 'Pro Member', price: '$15.00', status: 'Confirmed', date: '2026-04-18' },
    { id: 'TCK-1003', attendee: 'Sophia Patel', event: 'Campus Hackathon 2026', type: 'General Attendee', price: '$10.00', status: 'Confirmed', date: '2026-04-25' },
    { id: 'TCK-1004', attendee: 'Elena Vance', event: 'Campus Hackathon 2026', type: 'Free Student Pass', price: '$0.00', status: 'Checked In', date: '2026-04-25' },
    { id: 'TCK-1005', attendee: 'Jordan Miller', event: 'Spring Gala 2026', type: 'Pro Member', price: '$15.00', status: 'Pending', date: '2026-04-18' },
  ]);

  const columns = [
    { key: 'id', title: 'Ticket ID' },
    { key: 'attendee', title: 'Attendee' },
    { key: 'event', title: 'Event Name' },
    { key: 'type', title: 'Pass Type' },
    { key: 'price', title: 'Price' },
    {
      key: 'status',
      title: 'Status',
      render: (val) => (
        <span className={`cf-badge cf-badge-${val === 'Checked In' ? 'success' : val === 'Confirmed' ? 'primary' : 'warning'}`}>
          {val}
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in pb-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard', path: '/super-admin/dashboard' }, { label: 'Tickets', active: true }]} />
          <h2 className="fs-3 fw-bold text-dark mb-1">Ticketing & Box Office</h2>
          <p className="text-muted small mb-0">Manage event admissions, digital passes, and ticket revenue</p>
        </div>
        <button
          type="button"
          className="btn btn-cf-primary"
          onClick={() => showSuccessToast('Issue Ticket dialog opened')}
        >
          <i className="bi bi-ticket-perforated-fill" /> Issue Ticket Pass
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Total Tickets Sold" value="342" trendText="+18% vs last gala" trendDirection="up" icon="bi-ticket-detailed-fill" color="primary" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Gross Sales" value="$4,120" trendText="Average $12/pass" trendDirection="up" icon="bi-cash-coin" color="success" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Checked In" value="215" trendText="62.8% attendance rate" trendDirection="up" icon="bi-qr-code-scan" color="info" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard title="Refund Requests" value="2" trendText="0.5% return rate" trendDirection="down" icon="bi-arrow-counterclockwise" color="warning" />
        </div>
      </div>

      <div className="cf-card p-4" style={{ borderRadius: '12px' }}>
        <h5 className="fs-6 fw-bold mb-3 text-dark">Issued Ticket Passes</h5>
        <Table columns={columns} data={tickets} searchKey="attendee" searchPlaceholder="Search ticket holder or event..." />
      </div>
    </div>
  );
};

export default Tickets;
