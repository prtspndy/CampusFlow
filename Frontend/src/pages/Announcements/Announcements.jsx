import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import Badge from '../../components/Cards/Badge';
import StatusChip from '../../components/Cards/StatusChip';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import TextareaField from '../../components/Forms/TextareaField';
import SearchBox from '../../components/Forms/SearchBox';
import EmptyState from '../../components/Cards/EmptyState';
import { MOCK_ANNOUNCEMENTS } from '../../constants/mockData';
import { showDeleteConfirm, showSuccessToast } from '../../components/Modal/confirmDialog';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'General',
    audience: 'All Members',
    channels: ['In-App', 'WhatsApp'],
    author: 'Alex Rivera (President)',
  });

  const handleChannelToggle = (ch) => {
    setFormData((prev) => {
      const exists = prev.channels.includes(ch);
      return {
        ...prev,
        channels: exists ? prev.channels.filter((c) => c !== ch) : [...prev.channels, ch],
      };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const newAnnouncement = {
      id: `ANC-${String(announcements.length + 1).padStart(2, '0')}`,
      ...formData,
      date: new Date().toISOString().split('T')[0],
      readCount: 1,
      pinned: formData.priority === 'Urgent',
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    showSuccessToast('Announcement broadcasted successfully across selected channels!');
    setIsModalOpen(false);
    setFormData({
      title: '',
      content: '',
      priority: 'General',
      audience: 'All Members',
      channels: ['In-App', 'WhatsApp'],
      author: 'Alex Rivera (President)',
    });
  };

  const handleDelete = async (item) => {
    const confirmed = await showDeleteConfirm(`announcement "${item.title}"`);
    if (confirmed) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
      showSuccessToast('Announcement deleted');
    }
  };

  const handleTogglePin = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a))
    );
  };

  const filteredList = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesAudience = audienceFilter === 'ALL' || a.audience === audienceFilter;
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
    return matchesSearch && matchesAudience && matchesPriority;
  });

  return (
    <div className="announcements-page">
      <Breadcrumb
        items={[{ label: 'Events & Engagement' }, { label: 'Announcements' }]}
        title="Broadcasts & Member Announcements"
        actionButton={
          <Button
            variant="primary"
            size="sm"
            icon="bi-broadcast-pin"
            onClick={() => setIsModalOpen(true)}
          >
            Create Announcement
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="cf-card p-3 mb-4 bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <select
            className="cf-select text-xs py-1.5 px-3"
            style={{ width: 'auto' }}
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
          >
            <option value="ALL">All Audiences</option>
            <option value="All Members">All Members</option>
            <option value="Volunteers Only">Volunteers Only</option>
            <option value="Merch Buyers">Merch Buyers</option>
            <option value="Unpaid Members">Unpaid Members</option>
          </select>

          <select
            className="cf-select text-xs py-1.5 px-3"
            style={{ width: 'auto' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="General">General</option>
          </select>
        </div>

        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search announcements..."
          className="ms-auto"
        />
      </div>

      {/* Announcements Stream */}
      {filteredList.length === 0 ? (
        <EmptyState
          icon="bi-megaphone"
          title="No announcements found"
          description="Try selecting a different priority or audience filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setAudienceFilter('ALL');
            setPriorityFilter('ALL');
          }}
        />
      ) : (
        <div className="d-flex flex-column gap-3 mb-4">
          {filteredList.map((item) => {
            const isUrgent = item.priority === 'Urgent';
            const isHigh = item.priority === 'High';

            return (
              <div
                key={item.id}
                className={`cf-card p-4 transition-all ${
                  item.pinned ? 'border-primary border-2 shadow-sm' : ''
                }`}
              >
                <div className="d-flex flex-column flex-sm-row align-items-sm-start justify-content-between gap-3 mb-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {item.pinned && (
                      <span className="cf-badge cf-badge-primary">
                        <i className="bi bi-pin-angle-fill" /> Pinned
                      </span>
                    )}
                    <span
                      className={`cf-badge ${
                        isUrgent
                          ? 'cf-badge-danger'
                          : isHigh
                          ? 'cf-badge-warning'
                          : 'cf-badge-neutral'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="cf-badge cf-badge-secondary">{item.audience}</span>
                    <span className="text-muted text-xs ms-1">
                      <i className="bi bi-calendar3 me-1" />
                      {item.date}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border p-1"
                      title={item.pinned ? 'Unpin' : 'Pin to top'}
                      onClick={() => handleTogglePin(item.id)}
                    >
                      <i className={`bi ${item.pinned ? 'bi-pin-fill text-primary' : 'bi-pin'}`} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-light border p-1 text-danger"
                      title="Delete"
                      onClick={() => handleDelete(item)}
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>

                <h5 className="fw-bold text-dark mb-2 fs-6">{item.title}</h5>
                <p className="text-secondary small mb-3">{item.content}</p>

                <div className="d-flex flex-wrap align-items-center justify-content-between pt-3 border-top border-light-subtle gap-2 text-xs text-muted">
                  <div className="d-flex align-items-center gap-2">
                    <span>
                      Posted by: <strong className="text-dark">{item.author}</strong>
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-1.5">
                      <span>Broadcasted to:</span>
                      {item.channels.map((ch, idx) => (
                        <span key={idx} className="badge bg-light text-dark border px-1.5 py-0.5">
                          {ch === 'In-App' && <i className="bi bi-phone me-1 text-primary" />}
                          {ch === 'WhatsApp' && <i className="bi bi-whatsapp me-1 text-success" />}
                          {ch === 'Email' && <i className="bi bi-envelope me-1 text-secondary" />}
                          {ch}
                        </span>
                      ))}
                    </div>

                    <span>
                      <i className="bi bi-eye me-1" />
                      {item.readCount} views
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast Composer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Broadcast New Announcement"
        subtitle="Write once and syndicate across In-App notifications, WhatsApp groups, and Email"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon="bi-send-fill" onClick={handleSave}>
              Publish Announcement
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <InputField
            label="Announcement Headline"
            placeholder="e.g. Venue Change for Friday Meeting"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <SelectField
                label="Target Audience"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                options={['All Members', 'Volunteers Only', 'Merch Buyers', 'Executive Board', 'Unpaid Members']}
              />
            </div>
            <div className="col-12 col-md-6">
              <SelectField
                label="Priority Level"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={['General', 'High', 'Urgent']}
              />
            </div>
          </div>

          <TextareaField
            label="Announcement Message Content"
            rows={4}
            placeholder="Write message details, links, instructions..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
          />

          <div className="mb-3">
            <label className="cf-label">Dispatch Channels</label>
            <div className="d-flex flex-wrap gap-3 p-3 rounded-3 bg-light border border-light-subtle">
              {['In-App', 'WhatsApp', 'Email'].map((channel) => (
                <label key={channel} className="form-check-label text-sm d-flex align-items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.channels.includes(channel)}
                    onChange={() => handleChannelToggle(channel)}
                  />
                  <span>
                    {channel === 'In-App' && <i className="bi bi-phone text-primary" />}
                    {channel === 'WhatsApp' && <i className="bi bi-whatsapp text-success" />}
                    {channel === 'Email' && <i className="bi bi-envelope text-secondary" />} {channel}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Announcements;
