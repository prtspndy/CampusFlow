export type ExpenseCategory = 'Equipment' | 'Refreshments' | 'Venue' | 'Marketing' | 'Logistics'

export interface ExpenseItem {
  id: string
  clubId: string
  title: string
  amount: number
  category: ExpenseCategory
  date: string
  receiptUrl?: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface ClubBudgetSummary {
  clubId: string
  totalBudget: number
  spentAmount: number
  remainingAmount: number
  pendingApprovalsAmount: number
}
