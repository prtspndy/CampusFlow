// CampusFlow Mock Database & Initial State
export const INITIAL_ORG_INFO = {
  name: 'Skyline Student Association',
  shortName: 'Skyline SA',
  tagline: 'Empowering student leaders and vibrant campus life',
  founded: 2018,
  activeSemester: 'Spring 2026',
  currentBalance: 12480.50,
  currency: '$',
  email: 'board@skylinesa.org',
  website: 'https://skyline.campusflow.edu',
  phone: '+1 (555) 329-8812',
  location: 'Student Union Bldg, Suite 304',
};

export const INITIAL_USER = {
  id: 'USR-2026-001',
  name: 'Alex Rivera',
  title: 'President & Student Lead',
  email: 'alex.rivera@skyline.edu',
  studentId: 'STU-94021',
  department: 'Computer Science & Business',
  year: 'Senior (Class of 2026)',
  role: 'President',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  joinedDate: 'Sep 2023',
};

export const MOCK_NOTIFICATIONS = [
  { id: 'notif-1', title: 'Spring Gala Ticket Sold Out', time: '12 mins ago', icon: 'bi-ticket-detailed-fill', color: 'success', unread: true },
  { id: 'notif-2', title: 'New Reimbursement Claim ($64.20)', time: '45 mins ago', icon: 'bi-receipt', color: 'warning', unread: true },
  { id: 'notif-3', title: 'Elena Vance joined as Lifetime Member', time: '2 hours ago', icon: 'bi-person-plus-fill', color: 'primary', unread: true },
  { id: 'notif-4', title: 'Fundraiser Task: Bake Sale Prep marked completed', time: 'Yesterday', icon: 'bi-check2-circle', color: 'secondary', unread: false },
  { id: 'notif-5', title: 'Monthly Budget review ready for export', time: '2 days ago', icon: 'bi-file-earmark-bar-graph', color: 'primary', unread: false },
];

export const MOCK_DASHBOARD_STATS = {
  totalMembers: { value: '1,248', change: '+14% this month', trend: 'up' },
  activeMemberships: { value: '1,092', change: '87.5% renewal rate', trend: 'up' },
  upcomingEvents: { value: '5', change: '2 this weekend', trend: 'neutral' },
  ticketSales: { value: '342', change: '$4,120 gross sales', trend: 'up' },
  merchandiseSales: { value: '$2,850', change: '94 hoodies delivered', trend: 'up' },
  income: { value: '$18,450', change: '+22% vs last term', trend: 'up' },
  expenses: { value: '$5,970', change: '32% of semester budget', trend: 'down' },
  currentBalance: { value: '$12,480', change: 'Healthy treasury', trend: 'up' },
  pendingTasks: { value: '9', change: '3 due this week', trend: 'warning' },
  recentAnnouncements: { value: '14', change: '98% open rate', trend: 'up' },
};

export const MOCK_MEMBERS = [
  {
    id: 'MEM-001',
    name: 'Alex Rivera',
    email: 'alex.rivera@skyline.edu',
    studentId: 'STU-94021',
    major: 'Computer Science',
    year: 'Senior',
    tier: 'Executive / Board',
    status: 'Active',
    duesStatus: 'Paid',
    joined: '2023-09-01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    role: 'President'
  },
  {
    id: 'MEM-002',
    name: 'Marcus Chen',
    email: 'marcus.c@skyline.edu',
    studentId: 'STU-94033',
    major: 'Finance & Economics',
    year: 'Junior',
    tier: 'Pro Member',
    status: 'Active',
    duesStatus: 'Paid',
    joined: '2024-01-15',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    role: 'Treasurer'
  },
  {
    id: 'MEM-003',
    name: 'Sophia Patel',
    email: 'sophia.p@skyline.edu',
    studentId: 'STU-94112',
    major: 'Mechanical Engineering',
    year: 'Sophomore',
    tier: 'Lifetime Member',
    status: 'Active',
    duesStatus: 'Paid',
    joined: '2024-08-20',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    role: 'Event Director'
  },
  {
    id: 'MEM-004',
    name: 'Jordan Miller',
    email: 'jordan.m@skyline.edu',
    studentId: 'STU-93881',
    major: 'Graphic Design',
    year: 'Junior',
    tier: 'Pro Member',
    status: 'Active',
    duesStatus: 'Pending',
    joined: '2024-09-05',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    role: 'Marketing Lead'
  },
  {
    id: 'MEM-005',
    name: 'Elena Vance',
    email: 'elena.v@skyline.edu',
    studentId: 'STU-95104',
    major: 'Biochemistry',
    year: 'Freshman',
    tier: 'Basic Member',
    status: 'Active',
    duesStatus: 'Paid',
    joined: '2025-01-10',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    role: 'General Member'
  },
  {
    id: 'MEM-006',
    name: 'Liam O’Connor',
    email: 'liam.oc@skyline.edu',
    studentId: 'STU-92945',
    major: 'Business Admin',
    year: 'Senior',
    tier: 'Pro Member',
    status: 'Inactive',
    duesStatus: 'Overdue',
    joined: '2023-09-12',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
    role: 'General Member'
  },
  {
    id: 'MEM-007',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@skyline.edu',
    studentId: 'STU-95331',
    major: 'Data Science',
    year: 'Sophomore',
    tier: 'Lifetime Member',
    status: 'Active',
    duesStatus: 'Paid',
    joined: '2024-09-18',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    role: 'Volunteer Coordinator'
  },
  {
    id: 'MEM-008',
    name: 'Tyler Washington',
    email: 'tyler.w@skyline.edu',
    studentId: 'STU-94882',
    major: 'Psychology',
    year: 'Junior',
    tier: 'Basic Member',
    status: 'Active',
    duesStatus: 'Paid',
    joined: '2024-10-02',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    role: 'General Member'
  }
];

export const MOCK_MEMBERSHIP_TIERS = [
  {
    id: 'tier-basic',
    name: 'Basic Membership',
    price: 15,
    period: 'per academic year',
    description: 'Ideal for standard club participation and campus socials.',
    features: [
      'Official Skyline SA membership card & badge',
      'Access to all general club meetings & study nights',
      '10% discount on official merchandise',
      'Access to members-only WhatsApp & Discord community',
    ],
    popular: false,
    activeSubscribers: 420,
    color: 'secondary'
  },
  {
    id: 'tier-pro',
    name: 'Pro Member',
    price: 35,
    period: 'per academic year',
    description: 'Our most popular tier with priority perks & event savings.',
    features: [
      'All Basic perks included',
      'Free Spring Gala basic ticket (Value $25)',
      '20% discount on all club merchandise & hoodies',
      'Priority registration for industry visits & tech workshops',
      'Eligibility for volunteer committees and leadership roles',
    ],
    popular: true,
    activeSubscribers: 590,
    color: 'primary'
  },
  {
    id: 'tier-lifetime',
    name: 'Lifetime Executive Patron',
    price: 75,
    period: 'one-time dues',
    description: 'Lifetime recognition and full VIP access throughout university tenure.',
    features: [
      'All Pro perks for all 4 undergraduate years',
      'Exclusive Skyline SA embroidered varsity zip-hoodie included',
      'VIP front-row access and free entry to all annual galas',
      'Mentorship network & verified alumni referral letter',
      'Voting rights in executive board elections',
    ],
    popular: false,
    activeSubscribers: 82,
    color: 'warning'
  }
];

export const MOCK_EVENTS = [
  {
    id: 'EVT-2026-01',
    title: 'Spring Gala 2026: Celestial Odyssey',
    category: 'Gala & Social',
    date: '2026-04-18',
    time: '7:00 PM - 11:30 PM',
    location: 'Grand Ballroom, Skyline Union',
    memberPrice: 15,
    regularPrice: 30,
    capacity: 250,
    ticketsSold: 215,
    status: 'Upcoming',
    description: 'The premier annual social night featuring live student bands, catered banquet, awards ceremony, and red carpet photography.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'EVT-2026-02',
    title: 'Campus Hackathon 2026',
    category: 'Competition',
    date: '2026-04-25',
    time: '9:00 AM - 9:00 PM',
    location: 'Engineering Hub Lab 102',
    memberPrice: 0,
    regularPrice: 10,
    capacity: 120,
    ticketsSold: 110,
    status: 'Upcoming',
    description: '12-hour high octane build challenge with mentorship from tech alumni, free food, prizes, and swag bags.',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'EVT-2026-03',
    title: 'Charity Bake Sale Fundraiser',
    category: 'Fundraiser',
    date: '2026-04-08',
    time: '11:00 AM - 3:00 PM',
    location: 'Campus Quad Central Plaza',
    memberPrice: 0,
    regularPrice: 0,
    capacity: 400,
    ticketsSold: 180,
    status: 'Upcoming',
    description: 'Homemade treats, brownies, and matcha lattes prepared by our volunteer committee to fund club scholarships.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'EVT-2026-04',
    title: 'Executive Leadership Workshop',
    category: 'Workshop',
    date: '2026-03-20',
    time: '4:00 PM - 6:00 PM',
    location: 'Conference Rm B3',
    memberPrice: 5,
    regularPrice: 15,
    capacity: 50,
    ticketsSold: 50,
    status: 'Completed',
    description: 'Hands-on training for club project management, budget planning, and conflict resolution.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600'
  }
];

export const MOCK_ATTENDANCE = [
  { id: 'ATT-101', eventId: 'EVT-2026-01', eventTitle: 'Spring Gala 2026', studentName: 'Marcus Chen', studentId: 'STU-94033', ticketCode: 'TKT-SG-8841', checkInTime: '7:12 PM', status: 'Checked In', tier: 'Pro' },
  { id: 'ATT-102', eventId: 'EVT-2026-01', eventTitle: 'Spring Gala 2026', studentName: 'Sophia Patel', studentId: 'STU-94112', ticketCode: 'TKT-SG-8842', checkInTime: '7:15 PM', status: 'Checked In', tier: 'Lifetime' },
  { id: 'ATT-103', eventId: 'EVT-2026-01', eventTitle: 'Spring Gala 2026', studentName: 'Elena Vance', studentId: 'STU-95104', ticketCode: 'TKT-SG-8850', checkInTime: '7:22 PM', status: 'Checked In', tier: 'Basic' },
  { id: 'ATT-104', eventId: 'EVT-2026-01', eventTitle: 'Spring Gala 2026', studentName: 'Tyler Washington', studentId: 'STU-94882', ticketCode: 'TKT-SG-8899', checkInTime: '-', status: 'Registered (Pending)', tier: 'Basic' },
  { id: 'ATT-105', eventId: 'EVT-2026-01', eventTitle: 'Spring Gala 2026', studentName: 'Liam O’Connor', studentId: 'STU-92945', ticketCode: 'TKT-SG-8902', checkInTime: '-', status: 'Registered (Pending)', tier: 'Pro' },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 'ANC-01',
    title: 'Spring Gala 2026 Ticket Sales Now Open (Early Bird)',
    content: 'All Skyline SA members can now claim their discounted tickets via CampusFlow. Regular admission unlocks this Friday at 12:00 PM.',
    priority: 'Urgent',
    audience: 'All Members',
    channels: ['In-App', 'WhatsApp', 'Email'],
    author: 'Alex Rivera (President)',
    date: '2026-04-01',
    readCount: 842,
    pinned: true,
  },
  {
    id: 'ANC-02',
    title: 'Call for Volunteers: Bake Sale Setup & Logistics',
    content: 'We need 6 enthusiastic volunteers for table setup, card payment handling, and bakery packaging this Wednesday from 10:30 AM to 3:30 PM.',
    priority: 'High',
    audience: 'Volunteers Only',
    channels: ['In-App', 'WhatsApp'],
    author: 'Aisha Al-Mansoor',
    date: '2026-04-02',
    readCount: 145,
    pinned: false,
  },
  {
    id: 'ANC-03',
    title: 'Hoodie Pickup Notice: Student Union Room 304',
    content: 'Pre-ordered Skyline varsity hoodies from Batch #1 are now ready for collection during office hours (Mon-Thu 2-5 PM). Please bring student ID.',
    priority: 'General',
    audience: 'Merch Buyers',
    channels: ['In-App', 'Email'],
    author: 'Jordan Miller',
    date: '2026-03-29',
    readCount: 310,
    pinned: false,
  },
  {
    id: 'ANC-04',
    title: 'Dues Renewal Reminder for 2025-26 Term',
    content: 'Please ensure your semester dues are settled before April 15th to maintain voting rights and priority event ticket reservations.',
    priority: 'General',
    audience: 'Unpaid Members',
    channels: ['Email', 'In-App'],
    author: 'Marcus Chen (Treasurer)',
    date: '2026-03-25',
    readCount: 188,
    pinned: false,
  }
];

export const MOCK_MERCHANDISE = [
  {
    id: 'MRCH-01',
    name: 'Skyline Varsity Heavyweight Hoodie',
    category: 'Apparel',
    memberPrice: 38,
    regularPrice: 48,
    stock: 42,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Navy / White', 'Charcoal Grey', 'Sky Blue'],
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400',
    description: 'Custom embroidered 380 GSM fleece hoodie featuring the official Skyline crest and modern typography.'
  },
  {
    id: 'MRCH-02',
    name: 'Minimalist Club Polo Shirt',
    category: 'Apparel',
    memberPrice: 22,
    regularPrice: 28,
    stock: 28,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Crisp White', 'Navy Blue'],
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=400',
    description: '100% pique cotton breathable polo with subtle chest logo patch.'
  },
  {
    id: 'MRCH-03',
    name: 'Stainless Steel Insulated Water Bottle (750ml)',
    category: 'Accessories',
    memberPrice: 16,
    regularPrice: 22,
    stock: 65,
    sizes: ['750ml'],
    colors: ['Matte Black', 'Brushed Steel'],
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400',
    description: 'Double-walled vacuum insulated, keeps liquids icy cold for 24h or piping hot for 12h.'
  },
  {
    id: 'MRCH-04',
    name: 'Embroidered Heritage Dad Cap',
    category: 'Headwear',
    memberPrice: 14,
    regularPrice: 18,
    stock: 35,
    sizes: ['Adjustable'],
    colors: ['Navy Blue', 'Forest Green'],
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400',
    description: 'Washed chino twill cap with brass strap buckle and embroidered monogram.'
  },
  {
    id: 'MRCH-05',
    name: 'Vinyl Die-Cut Laptop Sticker Pack (Set of 6)',
    category: 'Stickers',
    memberPrice: 4,
    regularPrice: 6,
    stock: 150,
    sizes: ['Assorted Pack'],
    colors: ['Full Color'],
    image: 'https://images.unsplash.com/photo-1589384267710-7a25bc2f22b7?auto=format&fit=crop&q=80&w=400',
    description: 'Waterproof, scratch-resistant vinyl stickers designed by our design committee.'
  }
];

export const MOCK_ORDERS = [
  {
    id: 'ORD-8821',
    customer: 'Sophia Patel',
    email: 'sophia.p@skyline.edu',
    studentId: 'STU-94112',
    itemSummary: 'Skyline Varsity Hoodie (M, Navy) x 1',
    amount: 38.00,
    status: 'Fulfilled',
    paymentMethod: 'Card / Stripe',
    date: '2026-04-01',
  },
  {
    id: 'ORD-8822',
    customer: 'Elena Vance',
    email: 'elena.v@skyline.edu',
    studentId: 'STU-95104',
    itemSummary: 'Stainless Steel Bottle x 1, Sticker Pack x 2',
    amount: 24.00,
    status: 'Paid',
    paymentMethod: 'Razorpay / UPI',
    date: '2026-04-02',
  },
  {
    id: 'ORD-8823',
    customer: 'Tyler Washington',
    email: 'tyler.w@skyline.edu',
    studentId: 'STU-94882',
    itemSummary: 'Minimalist Club Polo (L) x 1',
    amount: 22.00,
    status: 'Pending',
    paymentMethod: 'Cash on Delivery',
    date: '2026-04-02',
  },
  {
    id: 'ORD-8824',
    customer: 'Jordan Miller',
    email: 'jordan.m@skyline.edu',
    studentId: 'STU-93881',
    itemSummary: 'Embroidered Dad Cap x 1, Hoodie (XL) x 1',
    amount: 52.00,
    status: 'Fulfilled',
    paymentMethod: 'Card / Stripe',
    date: '2026-03-30',
  }
];

export const MOCK_VOLUNTEERS = [
  {
    id: 'VOL-01',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@skyline.edu',
    phone: '+1 (555) 234-9081',
    committee: 'Operations & Logistics',
    hoursLogged: 42,
    activeTasks: 3,
    status: 'Active',
    skills: ['Event Setup', 'Crowd Management', 'Vendor Liaison'],
  },
  {
    id: 'VOL-02',
    name: 'Tyler Washington',
    email: 'tyler.w@skyline.edu',
    phone: '+1 (555) 678-1123',
    committee: 'Marketing & Design',
    hoursLogged: 28,
    activeTasks: 2,
    status: 'Active',
    skills: ['Social Media', 'Flyer Distribution', 'Photography'],
  },
  {
    id: 'VOL-03',
    name: 'Elena Vance',
    email: 'elena.v@skyline.edu',
    phone: '+1 (555) 890-4432',
    committee: 'Hospitality & Catering',
    hoursLogged: 19,
    activeTasks: 1,
    status: 'Active',
    skills: ['Baking', 'Check-In Desk', 'Inventory'],
  },
  {
    id: 'VOL-04',
    name: 'Jordan Miller',
    email: 'jordan.m@skyline.edu',
    phone: '+1 (555) 345-9876',
    committee: 'Media & Production',
    hoursLogged: 36,
    activeTasks: 2,
    status: 'Active',
    skills: ['Audio/Visual', 'Video Editing', 'Poster Design'],
  }
];

export const MOCK_TASKS = [
  {
    id: 'TSK-101',
    title: 'Order ingredients and packaging for Bake Sale',
    committee: 'Hospitality',
    assignedTo: 'Elena Vance',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-04-06',
    progress: 70
  },
  {
    id: 'TSK-102',
    title: 'Finalize DJ and lighting vendor contracts for Gala',
    committee: 'Logistics',
    assignedTo: 'Sophia Patel',
    priority: 'High',
    status: 'Review',
    dueDate: '2026-04-10',
    progress: 90
  },
  {
    id: 'TSK-103',
    title: 'Print QR code table check-in stands',
    committee: 'Marketing',
    assignedTo: 'Tyler Washington',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '2026-04-12',
    progress: 20
  },
  {
    id: 'TSK-104',
    title: 'Audit volunteer reimbursement receipts for March',
    committee: 'Finance',
    assignedTo: 'Marcus Chen',
    priority: 'High',
    status: 'Completed',
    dueDate: '2026-04-02',
    progress: 100
  },
  {
    id: 'TSK-105',
    title: 'Design sponsorship prospectus for Hackathon',
    committee: 'Media',
    assignedTo: 'Jordan Miller',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2026-04-15',
    progress: 45
  }
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'TXN-901',
    date: '2026-04-02',
    description: 'Ticket Revenue: Spring Gala 2026 (Batch 1)',
    category: 'Ticket Sales',
    type: 'Income',
    amount: 3225.00,
    status: 'Settled',
    account: 'Stripe Gateway'
  },
  {
    id: 'TXN-902',
    date: '2026-04-01',
    description: 'Merchandise Preorders: Skyline Varsity Hoodies',
    category: 'Merchandise',
    type: 'Income',
    amount: 1596.00,
    status: 'Settled',
    account: 'Bank Account'
  },
  {
    id: 'TXN-903',
    date: '2026-03-30',
    description: 'Grand Ballroom Venue Deposit: Spring Gala',
    category: 'Venue & Events',
    type: 'Expense',
    amount: 1200.00,
    status: 'Settled',
    account: 'Campus Credit Card'
  },
  {
    id: 'TXN-904',
    date: '2026-03-28',
    description: 'Volunteer Reimbursement: Bake Sale supplies (Aisha A.)',
    category: 'Reimbursement',
    type: 'Expense',
    amount: 64.20,
    status: 'Approved',
    account: 'Treasury Check'
  },
  {
    id: 'TXN-905',
    date: '2026-03-24',
    description: 'Membership Dues collection: Pro Tier (45 members)',
    category: 'Membership Dues',
    type: 'Income',
    amount: 1575.00,
    status: 'Settled',
    account: 'Bank Account'
  },
  {
    id: 'TXN-906',
    date: '2026-03-20',
    description: 'Audio & PA System Rental: Leadership Workshop',
    category: 'Equipment',
    type: 'Expense',
    amount: 240.00,
    status: 'Settled',
    account: 'Campus Credit Card'
  }
];

export const MOCK_FINANCE_METRICS = {
  totalIncome: 18450.00,
  totalExpenses: 5969.50,
  currentBalance: 12480.50,
  pendingReimbursements: 342.80,
  monthlyDuesGrowth: '+18.4%',
  budgetUtilization: '48.2%'
};

export const MOCK_CHART_DATA = {
  monthlyRevenue: {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr (Est)'],
    datasets: [
      {
        label: 'Income ($)',
        data: [2800, 3400, 4100, 5200, 7100, 8450],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Expenses ($)',
        data: [1200, 1900, 1400, 2600, 3100, 2400],
        borderColor: '#0EA5E9',
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        fill: true,
        tension: 0.35,
      }
    ]
  },
  membershipGrowth: {
    labels: ['Term 1', 'Term 2', 'Term 3', 'Fall 25', 'Spring 26'],
    datasets: [
      {
        label: 'Active Members',
        data: [350, 580, 790, 1020, 1248],
        backgroundColor: '#2563EB',
        borderRadius: 6,
      }
    ]
  },
  eventAttendance: {
    labels: ['Club Social', 'Orientation', 'Workshop A', 'Leadership Lab', 'Spring Gala (Sold)'],
    datasets: [
      {
        label: 'Attendees',
        data: [95, 180, 74, 50, 215],
        backgroundColor: '#0EA5E9',
        borderRadius: 6,
      }
    ]
  },
  expensesBreakdown: {
    labels: ['Events & Venue', 'Merch Production', 'Catering & Food', 'Marketing', 'Reimbursements'],
    datasets: [
      {
        data: [35, 25, 18, 12, 10],
        backgroundColor: ['#2563EB', '#0EA5E9', '#16A34A', '#F59E0B', '#8B5CF6'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }
    ]
  }
};
