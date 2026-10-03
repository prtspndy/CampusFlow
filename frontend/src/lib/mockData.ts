import type {
  ClubEvent,
  Product,
  Announcement,
  Task,
  Fundraiser,
  LedgerTransaction,
  ReimbursementRequest,
  Ticket,
  User,
  BroadcastChannel,
} from '../types/models'

export const MOCK_EVENTS: ClubEvent[] = [
  {
    id: 'event-gala-1',
    title: 'Skyline Annual Spring Gala 2026',
    description:
      'The premier campus celebration of the semester! Live music, guest keynote, alumni awards, and dinner reception.',
    venue: 'Grand University Hall & Lawn',
    startsAt: '2026-04-18T18:30:00Z',
    endsAt: '2026-04-18T23:00:00Z',
    memberPrice: 250,
    standardPrice: 400,
    totalCapacity: 200,
    registeredCount: 192, // 8 seats left -> triggers warning threshold per DESIGN.md!
    status: 'UPCOMING',
    category: 'Gala',
    isFeatured: true,
  },
  {
    id: 'event-hack-2',
    title: 'CampusFlow 48h Open Hackathon',
    description:
      'Build campus productivity tooling, compete for prizes, and get mentorship from industry engineers.',
    venue: 'Computing Complex Lab 3',
    startsAt: '2026-04-25T09:00:00Z',
    endsAt: '2026-04-27T09:00:00Z',
    memberPrice: 0,
    standardPrice: 150,
    totalCapacity: 120,
    registeredCount: 88,
    status: 'UPCOMING',
    category: 'Tech',
    isFeatured: false,
  },
  {
    id: 'event-welcome-3',
    title: 'Spring Semester Welcome Mixer',
    description:
      'Connect with club leads, meet fellow students, grab slice of pizza and pick up your official badge.',
    venue: 'Student Union Atrium',
    startsAt: '2026-05-02T16:00:00Z',
    endsAt: '2026-05-02T19:00:00Z',
    memberPrice: 0,
    standardPrice: 50,
    totalCapacity: 250,
    registeredCount: 250,
    status: 'UPCOMING',
    category: 'Social',
    isFeatured: false,
  },
]

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-hoodie-1',
    name: 'Skyline Heritage Navy Hoodie',
    description:
      'Heavyweight 380 GSM fleece with embroidered Skyline crest. Ultra-comfortable for chilly library study sessions.',
    imageUrl: '',
    memberPrice: 749,
    standardPrice: 899,
    category: 'Apparel',
    isAvailable: true,
    sizes: [
      { size: 'XS', stock: 0 }, // Out of stock -> strike through per DESIGN.md
      { size: 'S', stock: 3 }, // <= 5 -> '3 left' warning badge per DESIGN.md
      { size: 'M', stock: 18 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 6 },
      { size: 'XXL', stock: 2 },
    ],
  },
  {
    id: 'prod-tee-2',
    name: 'CampusFlow Skyline Blue Tee',
    description:
      '100% ring-spun organic cotton shirt with Skyline brand blue graphic. Breathable and relaxed fit.',
    imageUrl: '',
    memberPrice: 349,
    standardPrice: 449,
    category: 'Apparel',
    isAvailable: true,
    sizes: [
      { size: 'XS', stock: 5 },
      { size: 'S', stock: 20 },
      { size: 'M', stock: 35 },
      { size: 'L', stock: 24 },
      { size: 'XL', stock: 10 },
      { size: 'XXL', stock: 4 },
    ],
  },
  {
    id: 'prod-bottle-3',
    name: 'Thermal Stainless Steel Flask (750ml)',
    description:
      'Double-walled vacuum insulated bottle keeping cold drinks cold for 24h and hot drinks hot for 12h.',
    imageUrl: '',
    memberPrice: 420,
    standardPrice: 499,
    category: 'Accessories',
    isAvailable: true,
    sizes: [{ size: 'M', stock: 40 }],
  },
  {
    id: 'prod-stickers-4',
    name: 'Holographic CampusFlow Sticker Pack',
    description:
      'Set of 6 weather-proof vinyl stickers for laptop and bottle customization.',
    imageUrl: '',
    memberPrice: 99,
    standardPrice: 149,
    category: 'Accessories',
    isAvailable: true,
    sizes: [{ size: 'M', stock: 150 }],
  },
]

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Spring Gala Ticket Presale is officially open!',
    body: 'Members receive discounted ₹250 access with their active Member Pass. Only 200 total spots available in the Grand Hall. Grab yours before general public sale starts on Friday.',
    authorName: 'Elena Rostova',
    authorRole: 'Club President',
    audience: 'ALL_MEMBERS',
    channels: ['WEBSITE', 'EMAIL'] as BroadcastChannel[],
    sentAt: '2026-04-02T10:30:00Z',
    recipientCount: 214,
    openedCount: 171,
  },
  {
    id: 'ann-2',
    title: 'Volunteer Crew Briefing for Weekend Tech Expo',
    body: 'All confirmed booth staff and door check-in volunteers are requested to meet at Lab 3 at 4:30 PM for badge distribution and scanner setup walkthrough.',
    authorName: 'Marcus Vance',
    authorRole: 'Volunteer Lead',
    audience: 'VOLUNTEERS',
    channels: ['WEBSITE'] as BroadcastChannel[],
    sentAt: '2026-04-01T14:15:00Z',
    recipientCount: 28,
    openedCount: 26,
  },
]

export const MOCK_FUNDRAISER: Fundraiser = {
  id: 'fund-solar-1',
  title: 'Campus Solar Study Pavilions 2026',
  description:
    'Installing eco-friendly solar charging benches across campus greens for outdoor study groups.',
  goalAmount: 50000,
  currentAmount: 34500,
  deadline: '2026-05-15T23:59:59Z',
  donorCount: 142,
}

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    fundraiserId: 'fund-solar-1',
    title: 'Procure high-efficiency solar panel battery banks',
    description: 'Coordinate with supplier vendor and obtain discount quote.',
    assigneeName: undefined, // Unassigned per DESIGN.md!
    status: 'TODO',
    dueDate: '2026-04-10',
    isOverdue: false,
  },
  {
    id: 'task-2',
    fundraiserId: 'fund-solar-1',
    title: 'Permit application submission to Campus Facilities',
    assigneeName: 'Devon Lee',
    status: 'IN_PROGRESS',
    dueDate: '2026-04-05',
    isOverdue: false,
  },
  {
    id: 'task-3',
    fundraiserId: 'fund-solar-1',
    title: 'Student Union sponsorship pledge letter signed',
    assigneeName: 'Elena Rostova',
    status: 'DONE',
    dueDate: '2026-03-28',
    isOverdue: false,
  },
  {
    id: 'task-4',
    fundraiserId: 'fund-solar-1',
    title: 'Finalize promotional banner graphics for plaza display',
    assigneeName: 'Priya Sharma',
    status: 'TODO',
    dueDate: '2026-03-30',
    isOverdue: true, // Overdue per DESIGN.md
  },
]

export const MOCK_LEDGER: LedgerTransaction[] = [
  {
    id: 'tx-1',
    date: '2026-04-02',
    description: 'Spring Gala Ticket Presale (Batch 1)',
    category: 'TICKETS',
    sourceName: 'Event #event-gala-1',
    amount: 32500, // Money in (+)
    status: 'COMPLETED',
  },
  {
    id: 'tx-2',
    date: '2026-04-01',
    description: 'Annual Membership Dues (42 student renewals)',
    category: 'DUES',
    sourceName: 'Membership portal',
    amount: 20958, // Money in (+)
    status: 'COMPLETED',
  },
  {
    id: 'tx-3',
    date: '2026-03-30',
    description: 'Sound System & Stage Lighting Rental Deposit',
    category: 'EXPENSE',
    sourceName: 'Invoice #AV-9012',
    amount: -18500, // Money out (−)
    status: 'COMPLETED',
  },
  {
    id: 'tx-4',
    date: '2026-03-27',
    description: 'Hoodie Bulk Manufacturing Order',
    category: 'MERCH',
    sourceName: 'Apparel Maker Co.',
    amount: -42000, // Money out (−)
    status: 'COMPLETED',
  },
  {
    id: 'tx-5',
    date: '2026-03-25',
    description: 'Solar Study Pavilion Alumni Donations',
    category: 'FUNDRAISER',
    sourceName: 'Fundraiser campaign',
    amount: 15000, // Money in (+)
    status: 'COMPLETED',
  },
]

export const MOCK_REIMBURSEMENTS: ReimbursementRequest[] = [
  {
    id: 'reimb-1',
    applicantName: 'Marcus Vance',
    applicantEmail: 'marcus.v@skyline.edu',
    amount: 1450,
    description: 'Volunteer snack boxes and water supplies for Mixer',
    category: 'Hospitality',
    status: 'APPROVED',
    submittedAt: '2026-03-29T11:20:00Z',
    reviewedAt: '2026-03-30T16:00:00Z',
  },
  {
    id: 'reimb-2',
    applicantName: 'Elena Rostova',
    applicantEmail: 'president@skyline.edu',
    amount: 3200,
    description: 'Guest speaker hospitality gift hampers & card',
    category: 'Admin',
    status: 'SUBMITTED',
    submittedAt: '2026-04-01T09:10:00Z',
  },
]

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'tick-gala-01',
    eventId: 'event-gala-1',
    eventTitle: 'Skyline Annual Spring Gala 2026',
    eventDate: 'Sat 18 Apr, 6:30 pm',
    eventVenue: 'Grand University Hall & Lawn',
    holderName: 'Aanya Patel',
    holderEmail: 'aanya.patel@skyline.edu',
    ticketType: 'Member',
    ticketCode: 'GALA-8831-V',
    qrPayload: 'https://campusflow.skyline.edu/tickets/GALA-8831-V',
    status: 'VALID',
    pricePaid: 250,
  },
  {
    id: 'tick-gala-02',
    eventId: 'event-gala-1',
    eventTitle: 'Skyline Annual Spring Gala 2026',
    eventDate: 'Sat 18 Apr, 6:30 pm',
    eventVenue: 'Grand University Hall & Lawn',
    holderName: 'Rohan Sharma',
    holderEmail: 'rohan.s@skyline.edu',
    ticketType: 'General',
    ticketCode: 'GALA-4219-U',
    qrPayload: 'https://campusflow.skyline.edu/tickets/GALA-4219-U',
    status: 'USED',
    pricePaid: 400,
    scannedAt: '7:42 pm',
  },
]

export const MOCK_MEMBERS: User[] = [
  {
    id: 'user-member-1',
    name: 'Aanya Patel',
    email: 'aanya.patel@skyline.edu',
    studentId: 'SKY-2024-8831',
    role: 'MEMBER',
    membership: {
      id: 'mem-101',
      userId: 'user-member-1',
      memberCode: 'CF-8831-2026',
      status: 'ACTIVE',
      validUntil: '2026-12-31T23:59:59Z',
      planName: 'Annual Gold Member',
      perks: ['Member ticket prices', '15% Merch discount', 'Priority RSVP'],
    },
  },
  {
    id: 'user-member-2',
    name: 'David Kim',
    email: 'david.k@skyline.edu',
    studentId: 'SKY-2023-1104',
    role: 'MEMBER',
    membership: {
      id: 'mem-102',
      userId: 'user-member-2',
      memberCode: 'CF-1104-2026',
      status: 'EXPIRING',
      validUntil: '2026-04-14T23:59:59Z',
      planName: 'Annual Gold Member',
      perks: ['Member ticket prices', '15% Merch discount'],
    },
  },
  {
    id: 'user-member-3',
    name: 'Zara Chen',
    email: 'zara.c@skyline.edu',
    studentId: 'SKY-2023-7721',
    role: 'MEMBER',
    membership: {
      id: 'mem-103',
      userId: 'user-member-3',
      memberCode: 'CF-7721-2025',
      status: 'EXPIRED',
      validUntil: '2025-12-31T23:59:59Z',
      planName: 'Semester Member',
      perks: ['Member ticket prices'],
    },
  },
]
