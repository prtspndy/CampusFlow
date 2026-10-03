import React, { useState, useMemo } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import DataTable from '../../components/Tables/DataTable';
import Button from '../../components/Buttons/Button';
import Avatar from '../../components/Cards/Avatar';
import StatusChip from '../../components/Cards/StatusChip';
import Badge from '../../components/Cards/Badge';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import { MOCK_MEMBERS } from '../../constants/mockData';
import { showDeleteConfirm, showSuccessToast } from '../../components/Modal/confirmDialog';

const Members = () => {
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filterTier, setFilterTier] = useState('ALL');
  const [filterDues, setFilterDues] = useState('ALL');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    studentId: '',
    major: '',
    year: 'Freshman',
    tier: 'Basic Member',
    duesStatus: 'Paid',
    role: 'General Member',
    status: 'Active',
  });

  // Filtered members by Tier and Dues
  const filteredData = useMemo(() => {
    return members.filter((m) => {
      const matchTier = filterTier === 'ALL' || m.tier.toLowerCase().includes(filterTier.toLowerCase());
      const matchDues = filterDues === 'ALL' || m.duesStatus.toLowerCase() === filterDues.toLowerCase();
      return matchTier && matchDues;
    });
  }, [members, filterTier, filterDues]);

  // Open Add modal
  const handleAddNew = () => {
    setFormData({
      id: `MEM-${String(members.length + 1).padStart(3, '0')}`,
      name: '',
      email: '',
      studentId: `STU-${Math.floor(90000 + Math.random() * 9000)}`,
      major: 'Computer Science',
      year: 'Freshman',
      tier: 'Basic Member',
      duesStatus: 'Paid',
      role: 'General Member',
      status: 'Active',
    });
    setIsEditModalOpen(true);
  };

  // Open Edit modal
  const handleEdit = (member) => {
    setFormData({ ...member });
    setIsEditModalOpen(true);
  };

  // Open View modal
  const handleView = (member) => {
    setSelectedMember(member);
    setIsViewModalOpen(true);
  };

  // Delete action with SweetAlert2
  const handleDelete = async (member) => {
    const confirmed = await showDeleteConfirm(`student record for ${member.name}`);
    if (confirmed) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      showSuccessToast(`${member.name} has been removed from membership`);
    }
  };

  // Save Add/Edit
  const handleSaveMember = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      return;
    }

    setMembers((prev) => {
      const index = prev.findIndex((m) => m.id === formData.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...formData };
        return updated;
      }
      return [
        {
          ...formData,
          joined: new Date().toISOString().split('T')[0],
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`,
        },
        ...prev,
      ];
    });

    showSuccessToast(
      formData.id && members.some((m) => m.id === formData.id)
        ? 'Member details updated'
        : 'New member registered successfully'
    );
    setIsEditModalOpen(false);
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'name',
      label: 'Member Name & ID',
      sortable: true,
      render: (val, row) => (
        <div className="d-flex align-items-center gap-3">
          <Avatar src={row.avatar} name={row.name} size="md" />
          <div>
            <span className="fw-semibold text-dark d-block">{row.name}</span>
            <span className="text-muted text-xs font-monospace">{row.studentId}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact Email',
      sortable: true,
      render: (val) => <span className="text-secondary small">{val}</span>,
    },
    {
      key: 'major',
      label: 'Major & Class',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="d-block text-dark small fw-medium">{row.major}</span>
          <span className="text-muted text-xs">{row.year}</span>
        </div>
      ),
    },
    {
      key: 'tier',
      label: 'Membership Tier',
      sortable: true,
      render: (val) => {
        let variant = 'primary';
        if (val.includes('Lifetime') || val.includes('Executive')) variant = 'warning';
        if (val.includes('Basic')) variant = 'secondary';
        return <Badge variant={variant}>{val}</Badge>;
      },
    },
    {
      key: 'duesStatus',
      label: 'Dues Status',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
  ];

  return (
    <div className="members-page">
      <Breadcrumb
        items={[{ label: 'Directory' }, { label: 'Members' }]}
        title="Student Members Directory"
        actionButton={
          <Button variant="primary" size="sm" icon="bi-person-plus-fill" onClick={handleAddNew}>
            Register New Member
          </Button>
        }
      />

      {/* Main Table with filter dropdowns in filterComponent slot */}
      <DataTable
        title="All Registered Members"
        subtitle={`Displaying ${filteredData.length} enrolled students for Skyline Student Association`}
        columns={columns}
        data={filteredData}
        searchKeys={['name', 'email', 'studentId', 'major']}
        searchPlaceholder="Search by name, ID, or major..."
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        exportFileName="skyline_members"
        filterComponent={
          <div className="d-flex align-items-center gap-2">
            <select
              className="cf-select py-1 px-2 text-xs"
              style={{ width: 'auto' }}
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
            >
              <option value="ALL">All Tiers</option>
              <option value="Basic">Basic Tier</option>
              <option value="Pro">Pro Tier</option>
              <option value="Lifetime">Lifetime Tier</option>
            </select>

            <select
              className="cf-select py-1 px-2 text-xs"
              style={{ width: 'auto' }}
              value={filterDues}
              onChange={(e) => setFilterDues(e.target.value)}
            >
              <option value="ALL">All Dues</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        }
      />

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={formData.id && members.some((m) => m.id === formData.id) ? 'Edit Member Profile' : 'New Member Registration'}
        subtitle="Manage student dues, tier privileges, and contact details"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon="bi-check-lg" onClick={handleSaveMember}>
              Save Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveMember}>
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <InputField
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Student Full Name"
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Student ID"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="STU-94000"
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <InputField
                label="University Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@skyline.edu"
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Academic Major"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="e.g. Electrical Engineering"
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-4">
              <SelectField
                label="Year of Study"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                options={['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']}
              />
            </div>
            <div className="col-12 col-md-4">
              <SelectField
                label="Membership Tier"
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                options={['Basic Member', 'Pro Member', 'Lifetime Member', 'Executive / Board']}
              />
            </div>
            <div className="col-12 col-md-4">
              <SelectField
                label="Dues Status"
                value={formData.duesStatus}
                onChange={(e) => setFormData({ ...formData, duesStatus: e.target.value })}
                options={['Paid', 'Pending', 'Overdue']}
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <InputField
                label="Assigned Club Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. General Member or Committee Lead"
              />
            </div>
            <div className="col-12 col-md-6">
              <SelectField
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={['Active', 'Inactive']}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Member Modal */}
      {selectedMember && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Student Membership Profile"
          subtitle={`Skyline Student Association Official ID: ${selectedMember.id}`}
          size="md"
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          }
        >
          {/* Virtual Membership Card */}
          <div
            className="p-4 rounded-3 text-white mb-4 shadow-sm position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #0EA5E9 100%)',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="text-white-50 text-xs text-uppercase letter-spacing-1">
                  Skyline Student Association
                </span>
                <h5 className="fw-bold text-white mb-0">{selectedMember.name}</h5>
              </div>
              <span className="badge bg-white text-primary rounded-pill px-2.5 py-1 text-xs fw-bold">
                {selectedMember.tier}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-end mt-4 pt-2 border-top border-white border-opacity-25">
              <div>
                <span className="text-white-50 text-xs d-block">Student ID</span>
                <span className="fw-mono text-white fw-bold">{selectedMember.studentId}</span>
              </div>
              <div className="text-end">
                <span className="text-white-50 text-xs d-block">Member Since</span>
                <span className="text-white fw-medium small">{selectedMember.joined || 'Sep 2024'}</span>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <span className="text-muted text-xs d-block">Contact Email</span>
              <strong className="text-dark small">{selectedMember.email}</strong>
            </div>
            <div className="col-6">
              <span className="text-muted text-xs d-block">Major & Class</span>
              <strong className="text-dark small">{selectedMember.major} ({selectedMember.year})</strong>
            </div>
            <div className="col-6">
              <span className="text-muted text-xs d-block">Dues Payment</span>
              <StatusChip status={selectedMember.duesStatus} />
            </div>
            <div className="col-6">
              <span className="text-muted text-xs d-block">Account Status</span>
              <StatusChip status={selectedMember.status} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Members;
