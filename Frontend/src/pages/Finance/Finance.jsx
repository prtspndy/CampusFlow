import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import DataTable from '../../components/Tables/DataTable';
import Button from '../../components/Buttons/Button';
import StatusChip from '../../components/Cards/StatusChip';
import Badge from '../../components/Cards/Badge';
import Modal from '../../components/Modal/Modal';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import { MOCK_TRANSACTIONS, MOCK_FINANCE_METRICS } from '../../constants/mockData';
import { showSuccessToast, showDeleteConfirm } from '../../components/Modal/confirmDialog';

const Finance = () => {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [metrics, setMetrics] = useState(MOCK_FINANCE_METRICS);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    description: '',
    category: 'Ticket Sales',
    type: 'Income',
    amount: '',
    status: 'Settled',
    account: 'Bank Account',
  });

  const handleAddNew = (defaultType = 'Income') => {
    setFormData({
      id: `TXN-${transactions.length + 901}`,
      description: '',
      category: defaultType === 'Income' ? 'Ticket Sales' : 'Reimbursement',
      type: defaultType,
      amount: '',
      status: 'Settled',
      account: 'Stripe Gateway',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const amt = parseFloat(formData.amount);
    const newTxn = {
      ...formData,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
    };

    setTransactions([newTxn, ...transactions]);

    // Recalculate metrics
    if (newTxn.type === 'Income') {
      setMetrics((prev) => ({
        ...prev,
        totalIncome: prev.totalIncome + amt,
        currentBalance: prev.currentBalance + amt,
      }));
    } else {
      setMetrics((prev) => ({
        ...prev,
        totalExpenses: prev.totalExpenses + amt,
        currentBalance: prev.currentBalance - amt,
      }));
    }

    showSuccessToast(`Transaction of $${amt.toFixed(2)} recorded to treasury`);
    setIsModalOpen(false);
  };

  const handleDelete = async (txn) => {
    const confirmed = await showDeleteConfirm(`transaction record #${txn.id}`);
    if (confirmed) {
      setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
      showSuccessToast('Transaction entry deleted');
    }
  };

  const handleViewReceipt = (txn) => {
    setSelectedReceipt(txn);
  };

  const filteredTransactions = transactions.filter((t) => {
    return typeFilter === 'ALL' || t.type === typeFilter;
  });

  const columns = [
    {
      key: 'date',
      label: 'Transaction Date',
      sortable: true,
      render: (val) => <span className="text-secondary small font-monospace">{val}</span>,
    },
    {
      key: 'description',
      label: 'Description & Payee',
      sortable: true,
      render: (val, row) => (
        <div>
          <strong className="text-dark d-block">{val}</strong>
          <span className="text-muted text-xs">Account: {row.account}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (val) => <Badge variant="secondary">{val}</Badge>,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (val) => (
        <span className={`fw-semibold small ${val === 'Income' ? 'text-success' : 'text-danger'}`}>
          <i className={`bi ${val === 'Income' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'} me-1`} />
          {val}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (val, row) => (
        <span className={`fw-bold fs-6 ${row.type === 'Income' ? 'text-success' : 'text-dark'}`}>
          {row.type === 'Income' ? '+' : '-'}${val.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Settlement',
      sortable: true,
      render: (val) => <StatusChip status={val} />,
    },
    {
      key: 'receipt',
      label: 'Receipt Proof',
      render: (_, row) => (
        <button
          type="button"
          className="btn btn-xs btn-light border text-primary"
          onClick={() => handleViewReceipt(row)}
        >
          <i className="bi bi-receipt me-1" /> View
        </button>
      ),
    },
  ];

  return (
    <div className="finance-page">
      <Breadcrumb
        items={[{ label: 'Finance & Analytics' }, { label: 'Treasury Ledger' }]}
        title="Club Treasury & Financial Books"
        actionButton={
          <div className="d-flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="bi-receipt-cutoff"
              onClick={() => handleAddNew('Expense')}
            >
              Claim Reimbursement
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="bi-cash-coin"
              onClick={() => handleAddNew('Income')}
            >
              Record Income
            </Button>
          </div>
        }
      />

      {/* 4 Financial KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white border-start border-4 border-success">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Current Treasury Balance
            </span>
            <h3 className="fw-bold text-dark mb-0">${metrics.currentBalance.toLocaleString()}</h3>
            <span className="text-success text-xs fw-medium">
              <i className="bi bi-shield-check me-1" /> Audited & Verified
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white border-start border-4 border-primary">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Gross Income (Semester)
            </span>
            <h3 className="fw-bold text-primary mb-0">${metrics.totalIncome.toLocaleString()}</h3>
            <span className="text-muted text-xs">Dues, Gala Tickets & Hoodies</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white border-start border-4 border-danger">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Total Expenses Disbursed
            </span>
            <h3 className="fw-bold text-danger mb-0">${metrics.totalExpenses.toLocaleString()}</h3>
            <span className="text-muted text-xs">{metrics.budgetUtilization} of semester budget</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white border-start border-4 border-warning">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Pending Reimbursements
            </span>
            <h3 className="fw-bold text-warning mb-0">${metrics.pendingReimbursements.toFixed(2)}</h3>
            <span className="text-muted text-xs">2 claims awaiting treasurer sign-off</span>
          </div>
        </div>
      </div>

      {/* Transactions DataTable */}
      <DataTable
        title="Double-Entry Financial Ledger"
        subtitle="Full audit log of dues collected, ticket revenue, merch payouts, and reimbursements"
        columns={columns}
        data={filteredTransactions}
        searchKeys={['description', 'category', 'account', 'id']}
        onDelete={handleDelete}
        exportFileName="treasury_ledger"
        filterComponent={
          <select
            className="cf-select text-xs py-1 px-2"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Flows</option>
            <option value="Income">Income (+)</option>
            <option value="Expense">Expense (-)</option>
          </select>
        }
      />

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.type === 'Income' ? 'Record Income / Inflow' : 'Submit Expense / Reimbursement'}
        subtitle="Every transaction is audited and matched against university treasury records"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={formData.type === 'Income' ? 'primary' : 'danger'}
              size="sm"
              onClick={handleSave}
            >
              Post Transaction
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <SelectField
                label="Transaction Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={['Income', 'Expense']}
              />
            </div>
            <div className="col-12 col-md-6">
              <InputField
                label="Amount ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <InputField
            label="Transaction Description"
            placeholder="e.g. Venue deposit or Bake sale supplies reimbursement"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <SelectField
                label="Ledger Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  'Ticket Sales',
                  'Membership Dues',
                  'Merchandise',
                  'Venue & Events',
                  'Reimbursement',
                  'Equipment',
                  'Catering & Food',
                  'Donations',
                ]}
              />
            </div>
            <div className="col-12 col-md-6">
              <SelectField
                label="Payment / Treasury Account"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                options={['Stripe Gateway', 'Bank Account', 'Campus Credit Card', 'Cash Box', 'Treasury Check']}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="cf-label">Upload Receipt / Proof (PDF, PNG, JPG)</label>
            <input type="file" className="form-control form-control-sm" />
            <span className="text-muted text-xs mt-1 d-block">
              Simulated: file will be linked to this voucher for end-of-semester audit.
            </span>
          </div>
        </form>
      </Modal>

      {/* Digital Receipt View Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Digital Voucher & Receipt"
          subtitle={`Audit Voucher #${selectedReceipt.id}`}
          size="sm"
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
              Close
            </Button>
          }
        >
          <div className="p-3 bg-light rounded-3 border text-center mb-3">
            <i className="bi bi-file-earmark-check-fill fs-1 text-success mb-2 d-block" />
            <h5 className="fw-bold text-dark mb-1">{selectedReceipt.description}</h5>
            <span className="badge bg-white text-secondary border font-monospace mb-2">
              {selectedReceipt.id}
            </span>
            <div className="fs-4 fw-bold text-primary my-2">
              ${selectedReceipt.amount.toFixed(2)}
            </div>
            <div className="text-muted text-xs">
              Account: {selectedReceipt.account} • {selectedReceipt.date}
            </div>
          </div>

          <div className="p-2 border rounded-2 text-xs bg-white text-muted">
            <i className="bi bi-shield-lock me-1 text-success" />
            Digitally certified by Skyline SA Treasury Board for Spring 2026.
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Finance;
