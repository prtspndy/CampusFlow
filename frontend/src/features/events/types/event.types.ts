export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'completed'

export interface CampusEvent {
  id: string
  clubId: string
  clubName: string
  title: string
  description: string
  venue: string
  startTime: string
  endTime: string
  capacity: number
  rsvpCount: number
  status: EventStatus
  isRegistrationOpen: boolean
}
