import React from 'react'
import { MainLayout } from '@/components/layout'
import { BudgetOverview } from '@/features/budget'
import { Button, Card } from '@/components/common'
import type { ClubBudgetSummary } from '@/features/budget'

export const BudgetPage: React.FC = () => {
  const sampleSummary: ClubBudgetSummary = {
    clubId: 'c1',
    totalBudget: 15000,
    spentAmount: 8450,
    remainingAmount: 6550,
    pendingApprovalsAmount: 1200,
  }

  return (
    <MainLayout activePath="/budget">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Budget & Finance</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Track funding allocations, reimbursements, and club expense transparency.
            </p>
          </div>
          <Button variant="primary">+ Request Funding</Button>
        </div>

        <BudgetOverview summary={sampleSummary} />

        <Card>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
            Recent Financial Requests
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No pending reimbursement approvals currently.
          </p>
        </Card>
      </div>
    </MainLayout>
  )
}
