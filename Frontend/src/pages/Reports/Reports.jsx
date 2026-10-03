import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import ContentCard from '../../components/Cards/ContentCard';
import ChartCard from '../../components/Charts/ChartCard';
import Modal from '../../components/Modal/Modal';
import { MOCK_CHART_DATA, INITIAL_ORG_INFO, MOCK_FINANCE_METRICS } from '../../constants/mockData';
import { showSuccessToast } from '../../components/Modal/confirmDialog';

const Reports = () => {
  const [selectedTerm, setSelectedTerm] = useState('Spring 2026');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleDownloadReport = () => {
    showSuccessToast(`Exported Official Semester Report for ${selectedTerm} (PDF)`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="reports-page">
      <Breadcrumb
        items={[{ label: 'Finance & Analytics' }, { label: 'Reports' }]}
        title="Semester Reports & Executive Audits"
        actionButton={
          <div className="d-flex gap-2">
            <select
              className="cf-select text-xs py-1.5 px-3"
              style={{ width: 'auto' }}
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="Spring 2026">Spring 2026 (Current Term)</option>
              <option value="Fall 2025">Fall 2025 (Previous Term)</option>
              <option value="Academic Year 2025-26">Full Academic Year 2025-26</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              icon="bi-file-earmark-pdf-fill"
              onClick={() => setIsExportModalOpen(true)}
            >
              Generate PDF Report
            </Button>
          </div>
        }
      />

      {/* Executive KPI Scorecard */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Member Retention Rate
            </span>
            <h3 className="fw-bold text-dark mb-0">87.5%</h3>
            <span className="text-success text-xs fw-medium">
              <i className="bi bi-arrow-up-right me-1" /> +6.2% vs previous year
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Average Event ROI
            </span>
            <h3 className="fw-bold text-primary mb-0">142%</h3>
            <span className="text-muted text-xs">Self-sustaining ticket sales</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Budget Utilization
            </span>
            <h3 className="fw-bold text-dark mb-0">{MOCK_FINANCE_METRICS.budgetUtilization}</h3>
            <span className="text-muted text-xs">32% reserve buffer preserved</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="cf-card p-4 bg-white">
            <span className="text-muted text-xs text-uppercase fw-semibold d-block mb-1">
              Treasury Health Rating
            </span>
            <h3 className="fw-bold text-success mb-0">Grade A+</h3>
            <span className="text-muted text-xs">Full zero-discrepancy audit</span>
          </div>
        </div>
      </div>

      {/* Analytical Charts */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <ChartCard
            title="Semester Financial Trajectory"
            subtitle="Cumulative cash inflows vs operational costs"
            type="line"
            data={MOCK_CHART_DATA.monthlyRevenue}
            badgeText="Audited"
            badgeVariant="success"
          />
        </div>

        <div className="col-12 col-lg-5">
          <ChartCard
            title="Operational Expenditure Split"
            subtitle="Cost centers by committee responsibility"
            type="doughnut"
            data={MOCK_CHART_DATA.expensesBreakdown}
            badgeText="Verified"
            badgeVariant="primary"
          />
        </div>
      </div>

      {/* Detailed Semester Summary Card */}
      <ContentCard
        title="Executive Summary & Semester Milestones"
        subtitle={`Official audit statement for ${INITIAL_ORG_INFO.name}`}
        icon="bi-journal-check"
      >
        <div className="d-flex flex-column gap-3 text-secondary small">
          <p className="mb-0">
            During the <strong>{selectedTerm}</strong> term, the Skyline Student Association successfully transitioned all operations to the <strong>CampusFlow</strong> platform. Key milestones include:
          </p>
          <ul className="mb-0 d-flex flex-column gap-2">
            <li>
              <strong>Elimination of Spreadsheet Desyncs:</strong> 1,248 student profiles now dynamically reflect paid membership tiers with automated renewal reminders.
            </li>
            <li>
              <strong>Digital Door Check-in:</strong> Fast QR barcode verification reduced Gala and Workshop door queues from 20 minutes to under 5 seconds per student.
            </li>
            <li>
              <strong>Integrated Merchandise Logistics:</strong> 94 hoodies and apparel items pre-ordered and fulfilled through the integrated store without cash leakages.
            </li>
            <li>
              <strong>Treasury Transparency:</strong> 100% of volunteer reimbursements backed by digital vouchers, leaving an active closing balance of <strong>${INITIAL_ORG_INFO.currentBalance.toLocaleString()}</strong>.
            </li>
          </ul>
        </div>
      </ContentCard>

      {/* Export Report Preview Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Official Semester Audit Report"
        subtitle="Formatted for University Student Affairs & Faculty Advisors"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon="bi-download" onClick={handleDownloadReport}>
              Download PDF Report
            </Button>
          </>
        }
      >
        <div className="p-3 bg-light rounded-3 border mb-3">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: '42px', height: '42px' }}
            >
              <i className="bi bi-file-earmark-pdf fs-4" />
            </div>
            <div>
              <strong className="text-dark d-block">
                {INITIAL_ORG_INFO.shortName}_Semester_Audit_{selectedTerm.replace(/\s+/g, '_')}.pdf
              </strong>
              <span className="text-muted text-xs">Generated on {new Date().toLocaleDateString()} • 12 Pages</span>
            </div>
          </div>

          <div className="text-xs text-muted">
            Includes executive budget report, event turnout log, membership demographic breakdown, and signed treasurer reconciliation sheet.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
