import React from 'react'
import { Card } from '@/components/common'
import type { ClubBudgetSummary } from '../types/budget.types'
import { formatCurrency } from '@/utils/formatters'

export const BudgetOverview: React.FC<{ summary: ClubBudgetSummary }> = ({ summary }) => {
  const percentSpent = Math.round((summary.spentAmount / summary.totalBudget) * 100) || 0

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Financial Health & Budget</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-page)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Allocated</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {formatCurrency(summary.totalBudget)}
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-page)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spent</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
            {formatCurrency(summary.spentAmount)}
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-page)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.25rem' }}>
            {formatCurrency(summary.remainingAmount)}
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          <span>Utilization</span>
          <span style={{ fontWeight: 600 }}>{percentSpent}%</span>
        </div>
        <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(percentSpent, 100)}%`,
              backgroundColor: percentSpent > 90 ? 'var(--color-danger)' : 'var(--color-primary)',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </Card>
  )
}
