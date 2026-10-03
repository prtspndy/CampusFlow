import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/Cards/StatCard';
import ChartCard from '../../../components/Charts/ChartCard';
import Breadcrumb from '../../../components/Cards/Breadcrumb';
import Button from '../../../components/Buttons/Button';
import Loader from '../../../components/Loader/Loader';
import { dashboardService } from '../../../services/dashboardService';
import { showSuccessToast } from '../../../components/Modal/confirmDialog';

const TreasurerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await dashboardService.getTreasurerDashboard();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return <Loader text="Loading Treasury Dashboard..." fullScreen={false} />;
  }

  // Monthly Income Chart
  const monthlyIncomeChartData = {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Monthly Inflow ($)',
        data: data.monthlyIncomeData,
        backgroundColor: '#10B981',
        borderRadius: 8,
      },
    ],
  };

  // Monthly Expense Chart
  const monthlyExpenseChartData = {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Monthly Outflow ($)',
        data: data.monthlyExpenseData,
        backgroundColor: '#EF4444',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="treasurer-dashboard animate-fade-in pb-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'CampusFlow', path: '/treasurer/dashboard' },
              { label: 'Treasurer Hub', active: true },
            ]}
          />
          <h2 className="fs-3 fw-bold text-dark mb-1">Treasury & Finance Management</h2>
          <p className="text-muted small mb-0">
            Real-time balance reconciliation, revenue streams, and university disbursement tracking
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-cf-outline"
            onClick={() => showSuccessToast('Audited finance report exported')}
          >
            <i className="bi bi-download text-secondary" />
            <span>Export Statement</span>
          </button>
          <button
            type="button"
            className="btn btn-cf-primary"
            onClick={() => showSuccessToast('Expense voucher dialog opened')}
          >
            <i className="bi bi-plus-circle" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* 3 Required Cards */}
      <div className="row g-3 mb-4">
        {data.cards.map((card, idx) => (
          <div key={idx} className="col-12 col-md-4">
            <StatCard
              title={card.label}
              value={card.value}
              trendText={card.change}
              trendDirection={card.trend}
              icon={card.icon}
              color={card.color}
            />
          </div>
        ))}
      </div>

      {/* 2 Required Charts: Monthly Income & Monthly Expense */}
      <div className="row g-4 mb-4">
        {/* Monthly Income Chart */}
        <div className="col-12 col-lg-6">
          <ChartCard
            title="Monthly Income Breakdown"
            subtitle="Dues, ticket sales, sponsor grants ($)"
            type="bar"
            data={monthlyIncomeChartData}
            badgeText="Total: $18,450"
            badgeVariant="success"
            height={260}
          />
        </div>

        {/* Monthly Expense Chart */}
        <div className="col-12 col-lg-6">
          <ChartCard
            title="Monthly Expense Breakdown"
            subtitle="Venues, catering, production, logistics ($)"
            type="bar"
            data={monthlyExpenseChartData}
            badgeText="Total: $5,970"
            badgeVariant="danger"
            height={260}
          />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="cf-card p-4" style={{ borderRadius: '12px' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <div>
            <h5 className="fs-6 fw-bold mb-0 text-dark">Recent Ledger Transactions</h5>
            <p className="text-muted small mb-0">Verified account movements with receipts</p>
          </div>
          <span className="badge bg-light text-secondary border px-2.5 py-1 text-xs">
            {data.transactions.length} Recorded Entries
          </span>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-xs fw-semibold text-primary">{tx.id}</td>
                  <td>
                    <span className="fw-semibold text-dark text-xs d-block">{tx.description}</span>
                    <span className="text-muted text-xs">{tx.requestedBy || 'Skyline SA Treasury'}</span>
                  </td>
                  <td>
                    <span className="badge bg-light text-secondary border text-xs">
                      {tx.category}
                    </span>
                  </td>
                  <td className="text-xs">{tx.date}</td>
                  <td>
                    <span
                      className={`cf-badge cf-badge-${
                        tx.status === 'Completed' || tx.status === 'Approved' ? 'success' : 'warning'
                      } text-xs`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className={`text-end fw-bold text-xs ${tx.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                    {tx.type === 'Income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TreasurerDashboard;
