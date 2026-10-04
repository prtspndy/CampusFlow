# 🎓 CampusFlow

### The Operating System for Student Organizations

> **One platform to manage members, events, tickets, merchandise, volunteers, announcements, and finances — without the chaos of spreadsheets, paper records, and scattered WhatsApp messages.**

🚧 **CampusFlow is actively under development.**

---

## 💡 What is CampusFlow?

CampusFlow is a modern **student organization management platform** designed to bring the day-to-day operations of college clubs and student organizations into one centralized system.

Student organizations often depend on a mix of:

- 📊 Spreadsheets for members
- 💵 Notebooks for finances
- 🎟️ Manual ticket sales
- 💬 WhatsApp for announcements
- 🧾 Paper receipts for expenses
- 👕 Manual tracking for merchandise
- 🧑‍🤝‍🧑 Group chats for volunteer coordination

CampusFlow aims to replace this fragmented workflow with **one connected digital platform**.

The goal is simple:

> **Make running a student organization as organized as running a modern digital business.**

---

## 🎯 Problem We're Solving

Managing a student organization involves much more than organizing events.

Teams need to manage:

- Members and memberships
- Membership renewals
- Events and ticket sales
- Event check-ins
- Announcements
- Merchandise and inventory
- Volunteer tasks
- Fundraisers
- Expenses and reimbursements
- Revenue and financial reporting

When all of this is managed through disconnected tools, information gets lost, processes become manual, and nobody has a complete picture of the organization.

**CampusFlow brings these workflows together into a single operating system.**

---

## ✨ Core Features

### 👥 Membership Management

Manage the complete member lifecycle from one place.

- Member registration
- Member profiles
- Membership status
- Membership payments
- Membership benefits
- Membership expiry
- Renewal workflows
- Member verification

---

### 🎟️ Event & Ticket Management

Create and manage events without relying on manual ticket lists.

- Event creation
- Event information
- Online ticket sales
- Member & non-member pricing
- Ticket availability
- Ticket validation
- Event check-in
- Attendance tracking
- Event revenue tracking

---

### 📢 Announcements

Keep members informed from one centralized communication system.

- Create announcements
- Publish updates
- Reach members from one place
- Maintain announcement history
- Organize important club communication

---

### 👕 Merchandise & Inventory

Manage club merchandise and inventory digitally.

- Product management
- T-shirt / hoodie / merchandise listings
- Size-based inventory
- Online orders
- Payment tracking
- Stock management
- Inventory updates

---

### 🧑‍🤝‍🧑 Volunteer & Task Management

Turn scattered volunteer coordination into structured workflows.

- Create tasks
- Assign volunteers
- Track task status
- Monitor fundraiser activities
- See what is completed and what is still pending

---

### 💰 Finance Management

Give the organization a clear picture of its money.

Track:

- Membership revenue
- Ticket revenue
- Merchandise revenue
- Fundraising revenue
- Expenses
- Volunteer reimbursements
- Financial balance

The goal is to make it possible to answer:

> **How much money came in, where did it go, and how much do we have left?**

---

### 📊 Dashboards & Analytics

Turn operational data into useful insights.

Planned/ongoing dashboard capabilities include:

- Membership statistics
- Event performance
- Ticket sales
- Attendance
- Merchandise performance
- Revenue
- Expenses
- Financial summaries
- Operational insights

---

## 🏗️ Architecture

CampusFlow follows a modern full-stack architecture:

```text
┌─────────────────────────────────────────────┐
│                  CampusFlow                 │
├─────────────────────────────────────────────┤
│                                             │
│              React + Vite                  │
│              TypeScript                   │
│              Tailwind CSS                 │
│              shadcn/ui                    │
│                     │                       │
│                     ▼                       │
│             Node.js + Express              │
│                     │                       │
│                     ▼                       │
│                  Prisma                    │
│                     │                       │
│                     ▼                       │
│               PostgreSQL                   │
│                                             │
└─────────────────────────────────────────────┘
```

The application is being built with a separation between the frontend and backend so that the platform can evolve into a scalable multi-role system.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT / Better Auth |
| Validation | Zod |
| Forms | React Hook Form |
| Charts | Recharts |
| QR / Ticketing | qrcode |
| Payments | Razorpay |
| Frontend Deployment | Vercel |
| Backend Deployment | Render / Railway |
| Database Hosting | Neon |

---

## 🎨 Design Philosophy

CampusFlow is being designed as a **modern SaaS product rather than a traditional college administration dashboard**.

The visual direction focuses on:

- Minimal interfaces
- Strong typography
- Clean information hierarchy
- Generous whitespace
- Restrained color palette
- Thin borders
- Subtle UI surfaces
- Clear data visualization
- Responsive layouts
- Accessible interactions
- Consistent reusable components

### Design principles

**Clarity over decoration**

Every UI element should have a purpose.

**Consistency over complexity**

Reusable components and design tokens keep the experience coherent.

**Data should be easy to understand**

Dashboards, tables and analytics should communicate information quickly.

**Functionality first**

The interface should help organization members complete real tasks efficiently.

---

## 👤 User Roles

CampusFlow is being designed around the different people involved in running a student organization.

### 👨‍💼 Administrator

Responsible for managing the organization.

Typical responsibilities include:

- Members
- Events
- Tickets
- Merchandise
- Announcements
- Volunteers
- Finances
- Organization settings

### 💳 Treasurer

Focuses on:

- Revenue
- Expenses
- Reimbursements
- Financial records
- Financial reporting

### 🧑‍🤝‍🧑 Volunteer / Organizer

Focuses on:

- Assigned tasks
- Events
- Fundraisers
- Operational activities

### 🎓 Member

Can interact with the organization through:

- Membership
- Events
- Tickets
- Announcements
- Merchandise
- Orders

> Role capabilities will continue to evolve as development progresses.

---

## 🔐 Security

Security is an important part of the platform architecture.

The project includes/targets:

- Authentication
- Role-based authorization
- Protected API routes
- Input validation
- Secure password handling
- Environment-based configuration
- Controlled access to organization data

Security-related implementation will continue to evolve alongside the application.

---

## 📁 Project Structure

```text
CampusFlow/
│
├── backend/
│   ├── ...
│   └── Backend services & APIs
│
├── frontend/
│   ├── ...
│   └── React frontend application
│
├── docs/
│   ├── design/          # Visual system
│   ├── product/         # Brief and project context
│   ├── reference/       # API, roles, flows, codebase guide
│   └── delivery/        # Phase notes and viva prep
│
├── SECURITY.md
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- Git

---

### 1. Clone the repository

```bash
git clone https://github.com/prtspndy/CampusFlow.git
cd CampusFlow
```

---

### 2. Install dependencies

Install dependencies for the frontend and backend according to their respective project configuration.

```bash
cd frontend
npm install
```

Then:

```bash
cd ../backend
npm install
```

---

### 3. Configure environment variables

Create the required `.env` files for the frontend and backend.

Environment configuration may include:

```env
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

> Never commit real secrets or credentials to the repository.

---

### 4. Configure the database

CampusFlow uses **PostgreSQL with Prisma**.

Run the Prisma commands required by the current backend configuration.

```bash
npx prisma generate
```

For development migrations:

```bash
npx prisma migrate dev
```

---

### 5. Start the development servers

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

The exact scripts may evolve as development continues.

---

## 🧪 Development Status

CampusFlow is currently being actively developed.

### Current development focus

- [x] Project architecture
- [x] Frontend foundation
- [x] Backend foundation
- [x] Database architecture
- [x] Design system direction
- [ ] Complete membership workflows
- [ ] Complete event workflows
- [ ] Ticketing & QR check-in
- [ ] Merchandise & inventory
- [ ] Volunteer management
- [ ] Finance workflows
- [ ] Advanced analytics
- [ ] Production hardening
- [ ] Final deployment

> This checklist represents
# CampusFlow
The Operating System for Student Organizations

# Tech Stack

- Frontend        → React + Vite
- Language        → TypeScript
- UI              → Tailwind CSS + shadcn/ui
- Backend         → Node.js + Express
- Database        → PostgreSQL
- ORM             → Prisma
- Auth            → JWT / Better Auth
- Validation      → Zod
- Forms           → React Hook Form
- Charts          → Recharts
- QR              → qrcode
- Payments        → Razorpay
- Deployment      → Vercel + Render/Railway + Neon

# Theme 

Frontend Theme Direction for CampusFlow

I want CampusFlow's frontend to follow this visual direction: minimal, premium, modern SaaS/AI-tech aesthetic, similar to the reference image I shared.
Visual style:

- Clean white / slightly off-white background
- Strong black/dark charcoal typography
- Very minimal color palette with electric blue as the primary accent and orange as a small secondary accent
- Lots of whitespace and clean spacing
- Thin borders and subtle UI elements
- Modern editorial-style typography — bold clean headings + simple readable body text
- Minimal shadows; avoid heavy cards and excessive rounded/glassmorphism effects
- Use clean geometric/abstract illustrations where appropriate
- Overall feeling should be premium, futuristic, technical, trustworthy and minimal
  
Color direction:
Background → #FAFAF8 / white
Primary text → near-black / charcoal
Primary accent → electric blue
Secondary accent → orange
Keep the palette restrained; don't introduce many random colors.

Important: Don't copy the reference image's exact layout or graphics. Use it only as visual inspiration for the design language.
For CampusFlow, adapt this aesthetic into a student-organization management SaaS: clean dashboard, elegant data tables, modern cards, charts, event pages, membership pages, QR ticket UI, finance dashboard, etc.

Goal: It should look like a serious modern startup product, not a generic college project/admin template.
Please first establish a complete design system (colors, typography, spacing, buttons, cards, inputs, tables, badges, navigation, dashboard components) and then apply it consistently across the application.

“CampusFlow should feel like a premium minimalist AI/SaaS product — white/off-white canvas, dark typography, electric-blue primary accents, tiny orange highlights, lots of whitespace, thin geometric details, and zero generic-dashboard vibes.” 🔥
