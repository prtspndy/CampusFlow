export interface DashboardStats {
  activeClubsCount: number
  upcomingEventsCount: number
  pendingApprovalsCount: number
  activeMembersCount: number
}

export interface ActivityItem {
  id: string
  title: string
  timestamp: string
  type: 'event' | 'budget' | 'member' | 'approval'
  description: string
}
