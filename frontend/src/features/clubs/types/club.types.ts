export interface Club {
  id: string
  name: string
  category: 'Tech' | 'Cultural' | 'Sports' | 'Academic' | 'Social'
  description: string
  memberCount: number
  leadName: string
  budgetAllocated: number
  bannerUrl?: string
}

export interface ClubMember {
  id: string
  userId: string
  name: string
  role: 'President' | 'Treasurer' | 'Secretary' | 'Member'
  joinedDate: string
}
