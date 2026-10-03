import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import Badge from '../../components/Cards/Badge';
import StatusChip from '../../components/Cards/StatusChip';
import DataTable from '../../components/Tables/DataTable';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import TextareaField from '../../components/Forms/TextareaField';
import { MOCK_EVENTS } from '../../constants/mockData';
import { showDeleteConfirm, showSuccessToast } from '../../components/Modal/confirmDialog';

const Events = () => {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    category: 'Gala & Social',
    date: '',
    time: '',
    location: '',
    memberPrice: 0,
    regularPrice: 10,
    capacity: 100,
    status: 'Upcoming',
    description: '',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
  });

  const handleAddNew = () => {
    setFormData({
      id: `EVT-2026-0${events.length + 1}`,
      title: '',
      category: 'Gala & Social',
      date: new Date().toISOString().split('T')[0],
      time: '6:00 PM - 9:00 PM',
      location: 'Student Union Grand Hall',
      memberPrice: 10,
      regularPrice: 20,
      capacity: 150,
      status: 'Upcoming',
      description: '',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (event) => {
    setFormData({ ...event });
    setIsModalOpen(true);
  };

  const handleDelete = async (event) => {
    const confirmed = await showDeleteConfirm(`event "${event.title}"`);
    if (confirmed) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      showSuccessToast(`Event "${event.title}" removed`);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === formData.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...formData };
        return updated;
      }
      return [{ ...formData, ticketsSold: 0 }, ...prev];
    });

    showSuccessToast('Event details successfully saved');
    setIsModalOpen(false);
  };

  const handleView = (event) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const columns = [
    {
      key: 'title',
      label: 'Event Title & Venue',
      sortable: true,
      render: (val, row) => (
        <div className="d-flex align-items-center gap-3">
          <img
            src={row.image}
            alt={val}
            className="rounded-3 object-fit-cover"
            style={{ width: '50px', height: '50px' }}
          />
          <div>
            <strong className="text-dark d-block">{val}</strong>
            <span className="text-muted text-xs">
              <i className="bi bi-geo-alt me-1" />
              {row.location}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Schedule',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="text-dark small d-block">{val}</span>
          <span className="text-muted text-xs">{row.time}</span>
        </div>
      ),
    },
    {
      key: 'pricing',
      label: 'Ticket Pricing',
      render: (_, row) => (
        <div>
          <span className="text-primary fw-semibold small d-block">
            Member: ${row.memberPrice}
          </span>
          <span className="text-muted text-xs">Regular: ${row.regularPrice}</span>
        </div>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity / Sales',
      sortable: true,
      render: (_, row) => {
        const percent = Math.min(100, Math.round(((row.ticketsSold || 0) / row.capacity) * 100));
        return (
          <div style={{ minWidth: '120px' }}>
            <div className="d-flex justify-content-between text-xs mb-1">
              <span>{row.ticketsSold || 0} sold</span>
              <span className="text-muted">{row.capacity} max</span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div
                className={`progress-bar ${percent >= 90 ? 'bg-danger' : 'bg-primary'}`}
                role="progressbar"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
  ];

  return (
    <div className="events-page">
      <Breadcrumb
        items={[{ label: 'Events & Engagement' }, { label: 'Events' }]}
        title="Campus Events & Ticket Sales"
        actionButton={
          <div className="d-flex gap-2">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <i className="bi bi-grid-fill" />
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => setViewMode('table')}
                title="Table view"
              >
                <i className="bi bi-list-ul" />
              </button>
            </div>
            <Button variant="primary" size="sm" icon="bi-calendar-plus" onClick={handleAddNew}>
              Create Event
            </Button>
          </div>
        }
      />

      {/* Grid Mode */}
      {viewMode === 'grid' && (
        <div className="row g-4 mb-4">
          {events.map((evt) => {
            const sold = evt.ticketsSold || 0;
            const percent = Math.min(100, Math.round((sold / evt.capacity) * 100));
            return (
              <div key={evt.id} className="col-12 col-md-6 col-xl-4">
                <div className="cf-card cf-card-hover h-100 overflow-hidden d-flex flex-column">
                  <div className="position-relative" style={{ height: '180px' }}>
                    <img
                      src={evt.image}
                      alt={evt.title}
                      className="w-100 h-100 object-fit-cover"
                    />
                    <span className="position-absolute top-0 start-0 m-3 badge bg-white bg-opacity-90 text-dark shadow-sm">
                      {evt.category}
                    </span>
                    <span className="position-absolute top-0 end-0 m-3">
                      <StatusChip status={evt.status} />
                    </span>
                  </div>

                  <div className="p-4 d-flex flex-column flex-grow-1">
                    <h5 className="fw-bold text-dark mb-2 fs-6">{evt.title}</h5>

                    <div className="d-flex flex-column gap-1.5 text-xs text-secondary mb-3">
                      <div>
                        <i className="bi bi-calendar3 me-2 text-primary" />
                        {evt.date} • {evt.time}
                      </div>
                      <div>
                        <i className="bi bi-geo-alt me-2 text-secondary" />
                        {evt.location}
                      </div>
                      <div>
                        <i className="bi bi-ticket-perforated me-2 text-success" />
                        <strong>${evt.memberPrice}</strong> member price / ${evt.regularPrice} regular
                      </div>
                    </div>

                    <p className="text-muted small line-clamp-2 mb-3">
                      {evt.description || 'Join Skyline students for this landmark campus event.'}
                    </p>

                    <div className="mt-auto pt-3 border-top border-light-subtle">
                      <div className="d-flex justify-content-between text-xs mb-1.5">
                        <span className="text-muted">Tickets Reserved</span>
                        <strong className="text-dark">
                          {sold} / {evt.capacity} ({percent}%)
                        </strong>
                      </div>
                      <div className="progress mb-3" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${percent >= 90 ? 'bg-danger' : 'bg-primary'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="d-flex align-items-center justify-content-between pt-1">
                        <Button variant="outline" size="sm" onClick={() => handleView(evt)}>
                          View Details
                        </Button>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1.5 text-secondary"
                            title="Edit"
                            onClick={() => handleEdit(evt)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1.5 text-danger"
                            title="Delete"
                            onClick={() => handleDelete(evt)}
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && (
        <DataTable
          title="All Scheduled Events"
          columns={columns}
          data={events}
          searchKeys={['title', 'location', 'category']}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          exportFileName="skyline_events"
        />
      )}

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id && events.some((e) => e.id === formData.id) ? 'Edit Event Details' : 'Create Campus Event'}
        subtitle="Configure event scheduling, pricing, and ticket allotment"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Event
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <InputField
            label="Event Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Spring Gala 2026: Celestial Odyssey"
            required
          />

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <SelectField
                label="Event Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={['Gala & Social', 'Competition', 'Fundraiser', 'Workshop', 'General Meeting']}
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Campus Venue / Room"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Grand Ballroom, Skyline Union"
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <InputField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Time Interval"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="7:00 PM - 11:30 PM"
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-4">
              <InputField
                label="Member Ticket ($)"
                type="number"
                value={formData.memberPrice}
                onChange={(e) => setFormData({ ...formData, memberPrice: Number(e.target.value) })}
              />
            </div>
            <div className="col-12 col-md-4">
              <InputField
                label="Regular Ticket ($)"
                type="number"
                value={formData.regularPrice}
                onChange={(e) => setFormData({ ...formData, regularPrice: Number(e.target.value) })}
              />
            </div>
            <div className="col-12 col-md-4">
              <InputField
                label="Total Seat Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <TextareaField
            label="Event Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Outline schedule, catering, dress code, and highlights..."
          />
        </form>
      </Modal>

      {/* View Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedEvent.title}
          subtitle={`${selectedEvent.category} • Scheduled on ${selectedEvent.date}`}
          size="lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="mb-4 rounded-3 overflow-hidden" style={{ maxHeight: '240px' }}>
            <img
              src={selectedEvent.image}
              alt={selectedEvent.title}
              className="w-100 h-100 object-fit-cover"
            />
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <span className="text-muted text-xs d-block">Venue</span>
              <strong className="text-dark small">{selectedEvent.location}</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted text-xs d-block">Timing</span>
              <strong className="text-dark small">{selectedEvent.time}</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted text-xs d-block">Member Price</span>
              <strong className="text-primary small">${selectedEvent.memberPrice}.00</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted text-xs d-block">Regular Price</span>
              <strong className="text-dark small">${selectedEvent.regularPrice}.00</strong>
            </div>
          </div>

          <p className="text-secondary small">{selectedEvent.description}</p>
        </Modal>
      )}
    </div>
  );
};

export default Events;
