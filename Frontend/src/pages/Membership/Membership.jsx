import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import DataTable from '../../components/Tables/DataTable';
import Button from '../../components/Buttons/Button';
import Badge from '../../components/Cards/Badge';
import StatusChip from '../../components/Cards/StatusChip';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import { MOCK_MEMBERSHIP_TIERS, MOCK_MEMBERS } from '../../constants/mockData';
import { showSuccessToast, showConfirmDialog } from '../../components/Modal/confirmDialog';

const Membership = () => {
  const [tiers] = useState(MOCK_MEMBERSHIP_TIERS);
  const [records, setRecords] = useState([
    { id: 'REC-101', studentName: 'Alex Rivera', studentId: 'STU-94021', tier: 'Pro Member', amount: '$35.00', renewalDate: '2026-09-01', status: 'Active', autoRenew: true },
    { id: 'REC-102', studentName: 'Marcus Chen', studentId: 'STU-94033', tier: 'Pro Member', amount: '$35.00', renewalDate: '2026-09-01', status: 'Active', autoRenew: true },
    { id: 'REC-103', studentName: 'Sophia Patel', studentId: 'STU-94112', tier: 'Lifetime Member', amount: '$75.00', renewalDate: 'Lifetime (No Expiry)', status: 'Active', autoRenew: false },
    { id: 'REC-104', studentName: 'Jordan Miller', studentId: 'STU-93881', tier: 'Pro Member', amount: '$35.00', renewalDate: '2026-04-15', status: 'Expiring Soon', autoRenew: false },
    { id: 'REC-105', studentName: 'Elena Vance', studentId: 'STU-95104', tier: 'Basic Member', amount: '$15.00', renewalDate: '2026-09-01', status: 'Active', autoRenew: false },
    { id: 'REC-106', studentName: 'Liam O’Connor', studentId: 'STU-92945', tier: 'Pro Member', amount: '$35.00', renewalDate: '2026-03-01', status: 'Expired', autoRenew: false },
  ]);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    studentName: '',
    studentId: '',
    tier: 'Pro Member',
    paymentMethod: 'Card / Online',
  });

  const handleSendReminders = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Send Bulk Dues Reminders?',
      text: 'This will dispatch WhatsApp and Email notifications to 156 members with expiring or pending dues.',
      confirmButtonText: 'Yes, Send Reminders',
      icon: 'question',
    });

    if (confirmed) {
      showSuccessToast('Bulk reminders successfully dispatched to 156 students!');
    }
  };

  const handleAssignPlan = (e) => {
    e.preventDefault();
    if (!newPlan.studentName) return;

    const newRecord = {
      id: `REC-${records.length + 101}`,
      studentName: newPlan.studentName,
      studentId: newPlan.studentId || 'STU-95555',
      tier: newPlan.tier,
      amount: newPlan.tier.includes('Lifetime') ? '$75.00' : newPlan.tier.includes('Pro') ? '$35.00' : '$15.00',
      renewalDate: newPlan.tier.includes('Lifetime') ? 'Lifetime (No Expiry)' : '2027-04-01',
      status: 'Active',
      autoRenew: true,
    };

    setRecords([newRecord, ...records]);
    showSuccessToast(`Membership plan activated for ${newPlan.studentName}`);
    setIsAssignModalOpen(false);
    setNewPlan({ studentName: '', studentId: '', tier: 'Pro Member', paymentMethod: 'Card / Online' });
  };

  const columns = [
    {
      key: 'studentName',
      label: 'Student Member',
      sortable: true,
      render: (val, row) => (
        <div>
          <strong className="text-dark d-block">{val}</strong>
          <span className="text-muted text-xs font-monospace">{row.studentId}</span>
        </div>
      ),
    },
    {
      key: 'tier',
      label: 'Active Tier',
      sortable: true,
      render: (val) => {
        let variant = 'primary';
        if (val.includes('Lifetime')) variant = 'warning';
        if (val.includes('Basic')) variant = 'secondary';
        return <Badge variant={variant}>{val}</Badge>;
      },
    },
    {
      key: 'amount',
      label: 'Annual Rate',
      sortable: true,
      render: (val) => <span className="fw-semibold text-dark">{val}</span>,
    },
    {
      key: 'renewalDate',
      label: 'Renewal Due Date',
      sortable: true,
      render: (val) => (
        <span className="text-secondary small">
          <i className="bi bi-calendar-event me-1" />
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
  ];

  return (
    <div className="membership-page">
      <Breadcrumb
        items={[{ label: 'Directory' }, { label: 'Membership Tiers & Dues' }]}
        title="Membership Plans & Subscriptions"
        actionButton={
          <div className="d-flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="bi-bell-fill"
              onClick={handleSendReminders}
            >
              Send Renewal Notices
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="bi-plus-lg"
              onClick={() => setIsAssignModalOpen(true)}
            >
              Assign Membership
            </Button>
          </div>
        }
      />

      {/* Tier Pricing Cards Grid */}
      <div className="row g-3 mb-4">
        {tiers.map((tier) => (
          <div key={tier.id} className="col-12 col-lg-4">
            <div
              className={`cf-card p-4 h-100 position-relative ${
                tier.popular ? 'border-primary shadow-sm' : ''
              }`}
            >
              {tier.popular && (
                <span
                  className="position-absolute top-0 end-0 translate-middle-y me-4 badge bg-primary text-white rounded-pill px-3 py-1 shadow-sm text-xs font-semibold"
                >
                  Most Popular
                </span>
              )}

              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="fw-bold text-dark mb-0 fs-5">{tier.name}</h5>
                <Badge variant={tier.color}>{tier.activeSubscribers} Active</Badge>
              </div>

              <div className="d-flex align-items-baseline gap-1 my-3">
                <span className="fs-2 fw-bold text-dark">${tier.price}</span>
                <span className="text-muted small">/ {tier.period}</span>
              </div>

              <p className="text-secondary small mb-4">{tier.description}</p>

              <div className="border-top pt-3 mb-4">
                <span className="d-block text-xs fw-bold text-uppercase text-muted mb-2 letter-spacing-1">
                  Tier Privileges:
                </span>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="d-flex align-items-start gap-2 text-sm text-secondary">
                      <i className="bi bi-check2 text-primary fs-6 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <Button
                  variant={tier.popular ? 'primary' : 'outline'}
                  size="sm"
                  className="w-100 justify-content-center"
                  onClick={() => {
                    setNewPlan((prev) => ({ ...prev, tier: tier.name }));
                    setIsAssignModalOpen(true);
                  }}
                >
                  Enroll Student in {tier.name}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Membership Records Table */}
      <DataTable
        title="Membership Subscriptions Log"
        subtitle="Tracking active term licenses, renewals, and expiration timelines"
        columns={columns}
        data={records}
        searchKeys={['studentName', 'studentId', 'tier', 'status']}
        searchPlaceholder="Search subscription records..."
        exportFileName="skyline_subscriptions"
      />

      {/* Assign Membership Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Enroll Student in Membership Tier"
        subtitle="Record membership dues settlement and issue club privileges"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAssignPlan}>
              Confirm Subscription
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignPlan}>
          <InputField
            label="Student Full Name"
            placeholder="e.g. Liam O'Connor"
            value={newPlan.studentName}
            onChange={(e) => setNewPlan({ ...newPlan, studentName: e.target.value })}
            required
          />

          <InputField
            label="Student ID"
            placeholder="STU-92000"
            value={newPlan.studentId}
            onChange={(e) => setNewPlan({ ...newPlan, studentId: e.target.value })}
          />

          <SelectField
            label="Membership Plan"
            value={newPlan.tier}
            onChange={(e) => setNewPlan({ ...newPlan, tier: e.target.value })}
            options={['Basic Membership ($15)', 'Pro Member ($35)', 'Lifetime Executive Patron ($75)']}
          />

          <SelectField
            label="Payment Channel"
            value={newPlan.paymentMethod}
            onChange={(e) => setNewPlan({ ...newPlan, paymentMethod: e.target.value })}
            options={['Online Payment / Card', 'Cash at Welcome Desk', 'Campus Card Credit', 'Bank Transfer']}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Membership;
