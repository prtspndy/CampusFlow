import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import DataTable from '../../components/Tables/DataTable';
import StatusChip from '../../components/Cards/StatusChip';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modal/Modal';
import { MOCK_ORDERS } from '../../constants/mockData';
import { showDeleteConfirm, showSuccessToast } from '../../components/Modal/confirmDialog';

const Orders = () => {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const fulfilledCount = orders.filter((o) => o.status === 'Fulfilled').length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;

  const handleView = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (order) => {
    const confirmed = await showDeleteConfirm(`order record #${order.id}`);
    if (confirmed) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      showSuccessToast(`Order #${order.id} deleted`);
    }
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showSuccessToast(`Order #${orderId} marked as ${newStatus}`);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const filteredOrders = orders.filter((o) => {
    return statusFilter === 'ALL' || o.status === statusFilter;
  });

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      render: (val) => <span className="font-monospace fw-bold text-primary">{val}</span>,
    },
    {
      key: 'customer',
      label: 'Student Customer',
      sortable: true,
      render: (val, row) => (
        <div>
          <strong className="text-dark d-block">{val}</strong>
          <span className="text-muted text-xs">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'itemSummary',
      label: 'Items Ordered',
      render: (val) => <span className="text-secondary small">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Total',
      sortable: true,
      render: (val) => <strong className="text-dark">${val.toFixed(2)}</strong>,
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      sortable: true,
      render: (val) => (
        <span className="badge bg-light text-secondary border text-xs">
          <i className="bi bi-credit-card me-1" />
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Fulfillment Status',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
  ];

  return (
    <div className="orders-page">
      <Breadcrumb
        items={[{ label: 'Store & Operations' }, { label: 'Merchandise Orders' }]}
        title="Student Merchandise Orders"
      />

      {/* Top Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="cf-card p-3 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Total Order Volume
            </span>
            <h4 className="fw-bold text-dark mb-0">${totalRevenue.toFixed(2)}</h4>
            <span className="text-muted text-xs">{orders.length} orders total</span>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="cf-card p-3 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Delivered / Fulfilled
            </span>
            <h4 className="fw-bold text-success mb-0">{fulfilledCount}</h4>
            <span className="text-muted text-xs">Picked up at club office</span>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="cf-card p-3 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Awaiting Pickup / Pending
            </span>
            <h4 className="fw-bold text-warning mb-0">{pendingCount}</h4>
            <span className="text-muted text-xs">Ready in Union Room 304</span>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        title="Order Invoices & Fulfillment Log"
        subtitle="Manage student orders, pick up status, and payment receipts"
        columns={columns}
        data={filteredOrders}
        searchKeys={['id', 'customer', 'email', 'itemSummary']}
        onView={handleView}
        onDelete={handleDelete}
        exportFileName="skyline_merch_orders"
        filterComponent={
          <select
            className="cf-select text-xs py-1 px-2"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Fulfilled">Fulfilled</option>
          </select>
        }
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Order Details: ${selectedOrder.id}`}
          subtitle={`Placed by ${selectedOrder.customer} on ${selectedOrder.date}`}
          footer={
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Paid')}
                >
                  Mark Paid
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Fulfilled')}
                >
                  Mark Fulfilled
                </Button>
              </div>
              <Button variant="light" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="p-3 bg-light rounded-3 mb-3 border border-light-subtle">
            <div className="row g-2 text-xs">
              <div className="col-6">
                <span className="text-muted d-block">Customer</span>
                <strong className="text-dark small">{selectedOrder.customer}</strong>
              </div>
              <div className="col-6">
                <span className="text-muted d-block">Student ID</span>
                <strong className="text-dark small">{selectedOrder.studentId || 'STU-94000'}</strong>
              </div>
              <div className="col-6 mt-2">
                <span className="text-muted d-block">Email</span>
                <span className="text-dark">{selectedOrder.email}</span>
              </div>
              <div className="col-6 mt-2">
                <span className="text-muted d-block">Payment Method</span>
                <span className="text-dark">{selectedOrder.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-3 p-3 mb-3">
            <h6 className="fw-bold text-dark text-xs text-uppercase mb-2">Item Breakdown</h6>
            <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-sm">
              <span>{selectedOrder.itemSummary}</span>
              <strong className="text-dark">${selectedOrder.amount.toFixed(2)}</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center pt-2 text-sm fw-bold">
              <span>Total Paid</span>
              <span className="text-primary">${selectedOrder.amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border">
            <span className="text-xs text-muted">Current Order Status</span>
            <StatusChip status={selectedOrder.status} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
