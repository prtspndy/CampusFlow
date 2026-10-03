import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import DataTable from '../../components/Tables/DataTable';
import Button from '../../components/Buttons/Button';
import ContentCard from '../../components/Cards/ContentCard';
import StatusChip from '../../components/Cards/StatusChip';
import Badge from '../../components/Cards/Badge';
import { MOCK_ATTENDANCE, MOCK_EVENTS } from '../../constants/mockData';
import { showSuccessToast, showErrorToast } from '../../components/Modal/confirmDialog';

const Attendance = () => {
  const [selectedEventId, setSelectedEventId] = useState('EVT-2026-01');
  const [ticketQuery, setTicketQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [attendanceList, setAttendanceList] = useState(MOCK_ATTENDANCE);

  const selectedEvent = MOCK_EVENTS.find((e) => e.id === selectedEventId) || MOCK_EVENTS[0];

  // Current stats
  const checkedInCount = attendanceList.filter((a) => a.status === 'Checked In').length;
  const totalRegistered = attendanceList.length;
  const attendanceRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  // Manual Check-in by Ticket Code or Student ID
  const handleCheckIn = (e) => {
    e?.preventDefault();
    if (!ticketQuery.trim()) {
      showErrorToast('Please enter a ticket code or student ID');
      return;
    }

    const q = ticketQuery.trim().toLowerCase();
    const matchIndex = attendanceList.findIndex(
      (a) =>
        a.ticketCode.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.studentName.toLowerCase().includes(q)
    );

    if (matchIndex >= 0) {
      const match = attendanceList[matchIndex];
      if (match.status === 'Checked In') {
        showSuccessToast(`Ticket already checked in for ${match.studentName} at ${match.checkInTime}`);
      } else {
        const updated = [...attendanceList];
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        updated[matchIndex] = {
          ...match,
          status: 'Checked In',
          checkInTime: now,
        };
        setAttendanceList(updated);
        showSuccessToast(`Success! Checked in ${match.studentName} (${match.tier} Tier)`);
      }
      setTicketQuery('');
    } else {
      // Create new walk-in check-in
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newEntry = {
        id: `ATT-${attendanceList.length + 101}`,
        eventId: selectedEventId,
        eventTitle: selectedEvent.title,
        studentName: ticketQuery,
        studentId: 'STU-WALK-IN',
        ticketCode: `TKT-WLK-${Math.floor(1000 + Math.random() * 9000)}`,
        checkInTime: now,
        status: 'Checked In',
        tier: 'General',
      };
      setAttendanceList([newEntry, ...attendanceList]);
      showSuccessToast(`Walk-in attendee "${ticketQuery}" registered & checked in!`);
      setTicketQuery('');
    }
  };

  // Simulate QR Scanner trigger
  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      // Pick first pending attendee or simulate random
      const pending = attendanceList.find((a) => a.status !== 'Checked In');
      if (pending) {
        setTicketQuery(pending.ticketCode);
        showSuccessToast(`Scanned Ticket: ${pending.ticketCode}`);
      } else {
        showSuccessToast('QR Ticket Scanned: TKT-SG-8899 (Tyler Washington)');
        setTicketQuery('TKT-SG-8899');
      }
    }, 1200);
  };

  // Toggle individual row status
  const handleToggleRow = (row) => {
    const isChecked = row.status === 'Checked In';
    const updated = attendanceList.map((item) => {
      if (item.id === row.id) {
        return {
          ...item,
          status: isChecked ? 'Registered (Pending)' : 'Checked In',
          checkInTime: isChecked ? '-' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return item;
    });
    setAttendanceList(updated);
    showSuccessToast(
      isChecked
        ? `Check-in reverted for ${row.studentName}`
        : `Verified entry for ${row.studentName}`
    );
  };

  const columns = [
    {
      key: 'studentName',
      label: 'Student Attendee',
      sortable: true,
      render: (val, row) => (
        <div>
          <strong className="text-dark d-block">{val}</strong>
          <span className="text-muted text-xs font-monospace">{row.studentId}</span>
        </div>
      ),
    },
    {
      key: 'ticketCode',
      label: 'Ticket QR Code',
      sortable: true,
      render: (val) => (
        <span className="badge bg-light text-dark border font-monospace px-2 py-1">
          <i className="bi bi-qr-code me-1.5 text-primary" />
          {val}
        </span>
      ),
    },
    {
      key: 'tier',
      label: 'Membership Tier',
      sortable: true,
      render: (val) => <Badge variant={val === 'Pro' ? 'primary' : val === 'Lifetime' ? 'warning' : 'secondary'}>{val}</Badge>,
    },
    {
      key: 'checkInTime',
      label: 'Check-in Time',
      sortable: true,
      render: (val) => <span className="text-secondary small">{val}</span>,
    },
    {
      key: 'status',
      label: 'Verification Status',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
    {
      key: 'actions',
      label: 'Door Action',
      render: (_, row) => (
        <button
          type="button"
          className={`btn btn-xs ${row.status === 'Checked In' ? 'btn-outline-danger' : 'btn-success text-white'}`}
          onClick={() => handleToggleRow(row)}
        >
          {row.status === 'Checked In' ? 'Revert Check-in' : 'Verify & Enter'}
        </button>
      ),
    },
  ];

  return (
    <div className="attendance-page">
      <Breadcrumb
        items={[{ label: 'Events & Engagement' }, { label: 'Door Attendance' }]}
        title="Event Ticket Scanner & Attendance Desk"
      />

      {/* Top Controls: Event Selector & Scanner Simulation */}
      <div className="row g-3 mb-4">
        {/* Left: Event Selection & Turnout Card */}
        <div className="col-12 col-lg-5">
          <ContentCard
            title="Active Door Session"
            subtitle="Select event for real-time ticket scanning"
            icon="bi-door-open"
          >
            <div className="mb-3">
              <label className="cf-label">Current Event</label>
              <select
                className="cf-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {MOCK_EVENTS.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.date})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-3 bg-light border border-light-subtle mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary small fw-medium">Turnout Progress</span>
                <span className="fw-bold text-primary fs-6">{attendanceRate}%</span>
              </div>
              <div className="progress mb-2" style={{ height: '8px' }}>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <div className="d-flex justify-content-between text-xs text-muted">
                <span>
                  <strong>{checkedInCount}</strong> verified attendees
                </span>
                <span>
                  <strong>{totalRegistered}</strong> registered
                </span>
              </div>
            </div>

            <div className="text-muted text-xs">
              <i className="bi bi-info-circle me-1 text-primary" />
              Members in Pro & Lifetime tiers qualify for priority front check-in.
            </div>
          </ContentCard>
        </div>

        {/* Right: QR Code Scanner Simulator */}
        <div className="col-12 col-lg-7">
          <ContentCard
            title="Fast QR Ticket Scanner"
            subtitle="Scan digital barcode or manually enter student details"
            icon="bi-qr-code-scan"
          >
            <div className="row g-3 align-items-center">
              {/* Scanner Viewfinder Box */}
              <div className="col-12 col-sm-5 text-center">
                <div
                  className="p-3 rounded-3 border border-2 border-dashed border-primary position-relative d-flex flex-column align-items-center justify-content-center bg-light"
                  style={{ minHeight: '160px' }}
                >
                  {scanning ? (
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Scanning...</span>
                    </div>
                  ) : (
                    <>
                      <i className="bi bi-camera fs-1 text-primary mb-2" />
                      <span className="text-xs text-muted">Ready to read QR Ticket</span>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-100"
                    onClick={handleSimulateScan}
                    disabled={scanning}
                  >
                    {scanning ? 'Scanning...' : 'Simulate Scan'}
                  </Button>
                </div>
              </div>

              {/* Manual Input Form */}
              <div className="col-12 col-sm-7">
                <form onSubmit={handleCheckIn}>
                  <label className="cf-label">Ticket Code or Student ID</label>
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="cf-input"
                      placeholder="e.g. TKT-SG-8841 or STU-94033"
                      value={ticketQuery}
                      onChange={(e) => setTicketQuery(e.target.value)}
                    />
                    <Button type="submit" variant="primary" icon="bi-check-circle">
                      Check-In
                    </Button>
                  </div>
                  <span className="text-muted text-xs d-block">
                    Tip: Press enter to verify student admission instantly.
                  </span>
                </form>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>

      {/* Attendance Records Table */}
      <DataTable
        title={`Verified Check-in Registry: ${selectedEvent.title}`}
        subtitle="Live audit trail of verified tickets and admitted students"
        columns={columns}
        data={attendanceList}
        searchKeys={['studentName', 'studentId', 'ticketCode', 'status']}
        searchPlaceholder="Filter attendees by ticket # or student name..."
        exportFileName="attendance_registry"
      />
    </div>
  );
};

export default Attendance;
