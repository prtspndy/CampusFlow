import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import Badge from '../../components/Cards/Badge';
import StatusChip from '../../components/Cards/StatusChip';
import DataTable from '../../components/Tables/DataTable';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import { MOCK_TASKS } from '../../constants/mockData';
import { showSuccessToast, showDeleteConfirm } from '../../components/Modal/confirmDialog';

const Tasks = () => {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    committee: 'Hospitality',
    assignedTo: 'Elena Vance',
    priority: 'Medium',
    status: 'To Do',
    dueDate: new Date().toISOString().split('T')[0],
    progress: 0,
  });

  const handleAddNew = () => {
    setFormData({
      id: `TSK-10${tasks.length + 1}`,
      title: '',
      committee: 'Logistics',
      assignedTo: 'Tyler Washington',
      priority: 'Medium',
      status: 'To Do',
      dueDate: new Date().toISOString().split('T')[0],
      progress: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (task) => {
    setFormData({ ...task });
    setIsModalOpen(true);
  };

  const handleDelete = async (task) => {
    const confirmed = await showDeleteConfirm(`task "${task.title}"`);
    if (confirmed) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      showSuccessToast('Task deleted');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === formData.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...formData };
        return updated;
      }
      return [formData, ...prev];
    });

    showSuccessToast('Task saved successfully');
    setIsModalOpen(false);
  };

  const handleAdvanceStatus = (taskId, currentStatus) => {
    const sequence = ['To Do', 'In Progress', 'Review', 'Completed'];
    const nextIdx = (sequence.indexOf(currentStatus) + 1) % sequence.length;
    const nextStatus = sequence[nextIdx];
    const newProgress = nextStatus === 'Completed' ? 100 : nextStatus === 'In Progress' ? 50 : nextStatus === 'Review' ? 85 : 0;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus, progress: newProgress } : t))
    );
    showSuccessToast(`Task status updated to "${nextStatus}"`);
  };

  const boardColumns = ['To Do', 'In Progress', 'Review', 'Completed'];

  const columns = [
    {
      key: 'title',
      label: 'Task Description',
      sortable: true,
      render: (val, row) => (
        <div>
          <strong className="text-dark d-block">{val}</strong>
          <span className="text-muted text-xs">
            <i className="bi bi-tag me-1" />
            {row.committee}
          </span>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assignee',
      sortable: true,
      render: (val) => (
        <span className="text-secondary small">
          <i className="bi bi-person me-1 text-primary" />
          {val}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (val) => {
        const variant = val === 'High' ? 'danger' : val === 'Medium' ? 'warning' : 'secondary';
        return <Badge variant={variant}>{val}</Badge>;
      },
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (val) => <span className="text-secondary small">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
  ];

  return (
    <div className="tasks-page">
      <Breadcrumb
        items={[{ label: 'Store & Operations' }, { label: 'Tasks' }]}
        title="Operations & Committee Tasks"
        actionButton={
          <div className="d-flex gap-2">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn ${viewMode === 'board' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => setViewMode('board')}
                title="Kanban Board"
              >
                <i className="bi bi-kanban-fill" />
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-light border'}`}
                onClick={() => setViewMode('table')}
                title="List View"
              >
                <i className="bi bi-list-task" />
              </button>
            </div>

            <Button variant="primary" size="sm" icon="bi-plus-lg" onClick={handleAddNew}>
              New Task
            </Button>
          </div>
        }
      />

      {/* Kanban Board View */}
      {viewMode === 'board' && (
        <div className="row g-3 mb-4">
          {boardColumns.map((colName) => {
            const colTasks = tasks.filter((t) => t.status === colName);
            return (
              <div key={colName} className="col-12 col-md-6 col-xl-3">
                <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-bold text-dark text-sm">{colName}</span>
                    <span className="badge bg-white text-secondary border px-2 py-0.5 rounded-pill text-xs">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-2 flex-grow-1">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="cf-card p-3 bg-white border shadow-xs hover-bg-light transition-all"
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-light text-secondary border text-xs">
                            {task.committee}
                          </span>
                          <span
                            className={`badge ${
                              task.priority === 'High'
                                ? 'bg-danger-subtle text-danger'
                                : 'bg-warning-subtle text-warning'
                            } text-xs`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <p className="fw-semibold text-dark text-sm mb-2">{task.title}</p>

                        <div className="d-flex justify-content-between align-items-center text-xs text-muted mb-2">
                          <span>
                            <i className="bi bi-person me-1" />
                            {task.assignedTo}
                          </span>
                          <span>
                            <i className="bi bi-calendar-event me-1" />
                            {task.dueDate}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress mb-2" style={{ height: '4px' }}>
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light-subtle">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary py-0 px-1.5"
                            onClick={() => handleAdvanceStatus(task.id, task.status)}
                            title="Move to next stage"
                          >
                            Move <i className="bi bi-arrow-right" />
                          </button>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-xs btn-light border p-1"
                              onClick={() => handleEdit(task)}
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-light border p-1 text-danger"
                              onClick={() => handleDelete(task)}
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable
          title="Club Operations Task Board"
          columns={columns}
          data={tasks}
          searchKeys={['title', 'committee', 'assignedTo']}
          onEdit={handleEdit}
          onDelete={handleDelete}
          exportFileName="skyline_tasks"
        />
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id && tasks.some((t) => t.id === formData.id) ? 'Edit Task' : 'Create Committee Task'}
        subtitle="Organize bake sale, gala setups, and club responsibilities"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <InputField
            label="Task Title"
            placeholder="e.g. Order packaging boxes for bake sale"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <SelectField
                label="Committee"
                value={formData.committee}
                onChange={(e) => setFormData({ ...formData, committee: e.target.value })}
                options={['Hospitality', 'Logistics', 'Marketing', 'Finance', 'Media', 'Executive']}
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Assigned Volunteer / Officer"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-4">
              <SelectField
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={['Low', 'Medium', 'High']}
              />
            </div>
            <div className="col-12 col-md-4">
              <SelectField
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={['To Do', 'In Progress', 'Review', 'Completed']}
              />
            </div>
            <div className="col-12 col-md-4">
              <InputField
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
