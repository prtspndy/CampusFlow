import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import DataTable from '../../components/Tables/DataTable';
import Button from '../../components/Buttons/Button';
import Avatar from '../../components/Cards/Avatar';
import Badge from '../../components/Cards/Badge';
import StatusChip from '../../components/Cards/StatusChip';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import { MOCK_VOLUNTEERS } from '../../constants/mockData';
import { showSuccessToast, showDeleteConfirm } from '../../components/Modal/confirmDialog';

const Volunteers = () => {
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogHoursModalOpen, setIsLogHoursModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    committee: 'Operations & Logistics',
    hoursLogged: 0,
    activeTasks: 1,
    status: 'Active',
    skills: 'Event Setup, Check-In',
  });

  const [hoursToLog, setHoursToLog] = useState(4);
  const [hoursReason, setHoursReason] = useState('Bake Sale table management');

  const handleAddNew = () => {
    setFormData({
      id: `VOL-0${volunteers.length + 1}`,
      name: '',
      email: '',
      phone: '',
      committee: 'Operations & Logistics',
      hoursLogged: 0,
      activeTasks: 1,
      status: 'Active',
      skills: 'Event Setup, Check-In Desk',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenLogHours = (vol) => {
    setSelectedVolunteer(vol);
    setHoursToLog(4);
    setHoursReason('Event assistance & booth duty');
    setIsLogHoursModalOpen(true);
  };

  const handleSaveHours = (e) => {
    e.preventDefault();
    if (!selectedVolunteer) return;

    setVolunteers((prev) =>
      prev.map((v) =>
        v.id === selectedVolunteer.id
          ? { ...v, hoursLogged: v.hoursLogged + Number(hoursToLog) }
          : v
      )
    );

    showSuccessToast(`Logged ${hoursToLog} hours for ${selectedVolunteer.name}!`);
    setIsLogHoursModalOpen(false);
  };

  const handleSaveVolunteer = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const parsedSkills = typeof formData.skills === 'string'
      ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : formData.skills;

    const newVol = {
      ...formData,
      skills: parsedSkills,
    };

    setVolunteers([newVol, ...volunteers]);
    showSuccessToast(`${formData.name} added to volunteer committee`);
    setIsAddModalOpen(false);
  };

  const handleDelete = async (vol) => {
    const confirmed = await showDeleteConfirm(`volunteer ${vol.name}`);
    if (confirmed) {
      setVolunteers((prev) => prev.filter((v) => v.id !== vol.id));
      showSuccessToast(`${vol.name} removed from volunteer roster`);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Volunteer',
      sortable: true,
      render: (val, row) => (
        <div className="d-flex align-items-center gap-3">
          <Avatar name={val} size="md" />
          <div>
            <strong className="text-dark d-block">{val}</strong>
            <span className="text-muted text-xs">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'committee',
      label: 'Assigned Committee',
      sortable: true,
      render: (val) => <Badge variant="primary">{val}</Badge>,
    },
    {
      key: 'hoursLogged',
      label: 'Service Hours',
      sortable: true,
      render: (val, row) => (
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold fs-6 text-dark">{val} hrs</span>
          <button
            type="button"
            className="btn btn-xs btn-light border text-primary"
            onClick={() => handleOpenLogHours(row)}
            title="Log service hours"
          >
            + Log
          </button>
        </div>
      ),
    },
    {
      key: 'skills',
      label: 'Skills & Strengths',
      render: (val) => (
        <div className="d-flex flex-wrap gap-1">
          {(val || []).map((skill, idx) => (
            <span key={idx} className="badge bg-light text-secondary border text-xs">
              {skill}
            </span>
          ))}
        </div>
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
    <div className="volunteers-page">
      <Breadcrumb
        items={[{ label: 'Store & Operations' }, { label: 'Volunteers' }]}
        title="Volunteer Committee Roster"
        actionButton={
          <Button variant="primary" size="sm" icon="bi-person-plus-fill" onClick={handleAddNew}>
            Add Volunteer
          </Button>
        }
      />

      {/* Highlights Banner */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="cf-card p-3 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Active Volunteers
            </span>
            <h4 className="fw-bold text-dark mb-0">{volunteers.length} Students</h4>
            <span className="text-muted text-xs">Across 5 committees</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cf-card p-3 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Total Campus Service Hours
            </span>
            <h4 className="fw-bold text-primary mb-0">
              {volunteers.reduce((sum, v) => sum + v.hoursLogged, 0)} Hours
            </h4>
            <span className="text-muted text-xs">Eligible for university recognition</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cf-card p-3 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Top Contributor
            </span>
            <h4 className="fw-bold text-success mb-0">Aisha Al-Mansoor</h4>
            <span className="text-muted text-xs">42 verified hours this term</span>
          </div>
        </div>
      </div>

      <DataTable
        title="Active Volunteer Directory"
        subtitle="Track student community service, task distribution, and committee commitments"
        columns={columns}
        data={volunteers}
        searchKeys={['name', 'email', 'committee']}
        onDelete={handleDelete}
        exportFileName="skyline_volunteers"
      />

      {/* Add Volunteer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Recruit Student Volunteer"
        subtitle="Assign volunteer to club operations and track participation"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveVolunteer}>
              Add to Committee
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveVolunteer}>
          <InputField
            label="Student Full Name"
            placeholder="e.g. Jordan Miller"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <InputField
                label="Student Email"
                type="email"
                placeholder="student@skyline.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Contact Phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <SelectField
            label="Assigned Committee"
            value={formData.committee}
            onChange={(e) => setFormData({ ...formData, committee: e.target.value })}
            options={[
              'Operations & Logistics',
              'Marketing & Design',
              'Hospitality & Catering',
              'Media & Production',
              'Finance & Sponsorships',
            ]}
          />

          <InputField
            label="Skills & Interests (comma-separated)"
            placeholder="e.g. Photography, Food Prep, Ticket Verification"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
        </form>
      </Modal>

      {/* Log Hours Modal */}
      {selectedVolunteer && (
        <Modal
          isOpen={isLogHoursModalOpen}
          onClose={() => setIsLogHoursModalOpen(false)}
          title={`Log Service Hours: ${selectedVolunteer.name}`}
          subtitle={`Current logged hours: ${selectedVolunteer.hoursLogged} hrs`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsLogHoursModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveHours}>
                Confirm Hours
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveHours}>
            <InputField
              label="Additional Hours"
              type="number"
              value={hoursToLog}
              onChange={(e) => setHoursToLog(e.target.value)}
              required
            />
            <InputField
              label="Activity Description"
              value={hoursReason}
              onChange={(e) => setHoursReason(e.target.value)}
              placeholder="e.g. Setting up sound system for gala"
              required
            />
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Volunteers;
