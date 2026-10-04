# 🎓 CampusFlow

### The Operating System for Student Organizations

**CampusFlow** is a full-stack platform that brings student-organization operations into one centralized system — replacing scattered spreadsheets, manual records, chat groups, and disconnected workflows with a single digital workspace.

> **Manage members. Run events. Sell tickets. Track finances. Coordinate volunteers. Manage merchandise. — All from one place.**

<p align="center">
  <a href="https://campusflow-os.vercel.app/"><strong>🚀 Live Demo</strong></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://github.com/prtspndy/CampusFlow"><strong>💻 GitHub Repository</strong></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://youtu.be/O_EZjerq9rk"><strong>🎬 Demo Video</strong></a>
</p>

---

# 🏆 Built for a 24-Hour Hackathon

CampusFlow was built as a practical solution to a real campus problem:

> **Student organizations manage important operations across too many disconnected tools.**

Members live in spreadsheets.  
Events live in forms and chat groups.  
Tickets are tracked manually.  
Expenses live in notebooks or messages.  
Volunteers are coordinated through group chats.  
Financial information is difficult to consolidate.

CampusFlow brings these workflows together into one structured platform.

The goal was not to build another generic college dashboard.

**The goal was to build an actual operating system for student organizations.**

---

# 💡 The Problem

Running a college club or student organization involves many moving parts:

- 👥 Member management
- 🎟️ Events and ticketing
- 📢 Announcements
- 🧑‍🤝‍🧑 Volunteer coordination
- 👕 Merchandise
- 📦 Inventory
- 💰 Revenue and expenses
- 🧾 Payments and reimbursements
- 📊 Operational visibility

The problem is that these activities are usually handled using a mixture of:

```text
Spreadsheets
     +
Google Forms
     +
WhatsApp / Group Chats
     +
Paper Records
     +
Manual Payment Tracking
     +
Separate Event Tools
```

This creates fragmented data, duplicated work, poor visibility, and unnecessary administrative effort.

---

# 🚀 Our Solution

CampusFlow provides a centralized platform where an organization can manage its operational lifecycle from one place.

```text
                    ┌───────────────────────┐
                    │       CampusFlow      │
                    └───────────┬───────────┘
                                │
       ┌────────────┬───────────┼───────────┬────────────┐
       ▼            ▼           ▼           ▼            ▼
   Members       Events      Ticketing   Merchandise   Finance
       │            │           │           │            │
       └────────────┴───────────┼───────────┴────────────┘
                                │
                         ┌──────▼──────┐
                         │ Organization │
                         │   Operations │
                         └─────────────┘
```

Instead of managing individual processes separately, CampusFlow connects them into a single workflow.

---

# ✨ Key Features

## 👥 Membership Management

Centralize the complete member lifecycle.

- Member registration
- Member profiles
- Membership status
- Membership information
- Membership payments
- Membership verification
- Membership lifecycle management

---

## 🎟️ Event Management

Create and manage organization events from one place.

- Event creation
- Event details
- Event scheduling
- Ticket management
- Ticket availability
- Member / non-member pricing
- Event participation
- Attendance workflows

---

## 🎫 Digital Ticketing & QR

CampusFlow supports digital event ticketing with QR-based workflows.

```text
User
  │
  ▼
Register / Purchase Ticket
  │
  ▼
Digital Ticket
  │
  ▼
QR Code
  │
  ▼
Event Check-in
```

This reduces dependency on manual ticket lists and makes event entry easier to manage.

---

## 📢 Announcements

Keep organization members informed through centralized announcements.

- Create announcements
- Publish updates
- Share important information
- Maintain announcement history

---

## 👕 Merchandise & Inventory

Manage organization merchandise digitally.

- Product listings
- Merchandise management
- Inventory tracking
- Size-based stock
- Orders
- Payment tracking
- Stock updates

---

## 🧑‍🤝‍🧑 Volunteer & Task Management

Turn informal volunteer coordination into structured work.

- Create tasks
- Assign volunteers
- Track task status
- Monitor operational activities
- Track pending and completed work

---

## 💰 Finance Management

CampusFlow brings organization finances into one place.

Track:

- Membership revenue
- Event revenue
- Merchandise revenue
- Fundraising revenue
- Expenses
- Reimbursements
- Overall financial position

The objective is simple:

> **Know where the money came from, where it went, and what remains.**

---

# 👤 User Roles

CampusFlow is designed around the different people involved in a student organization.

### 👨‍💼 Administrator

Manages the organization and its operations.

Typical responsibilities include:

- Members
- Events
- Tickets
- Merchandise
- Announcements
- Volunteers
- Finances
- Organization operations

### 💳 Treasurer

Focuses primarily on financial operations.

- Revenue
- Expenses
- Reimbursements
- Financial records
- Payment-related workflows

### 🧑‍🤝‍🧑 Organizer / Volunteer

Focuses on execution.

- Assigned tasks
- Events
- Fundraising activities
- Operational activities

### 🎓 Member

Interacts with the organization through:

- Membership
- Events
- Tickets
- Announcements
- Merchandise
- Orders

---

# 🧠 Why CampusFlow?

CampusFlow is not just an event-management application.

It connects multiple operational systems that normally exist independently.

| Traditional Approach | CampusFlow |
|---|---|
| Spreadsheet-based members | Centralized member management |
| Manual ticket lists | Digital ticketing |
| Paper / manual check-ins | QR-based workflow |
| Group-chat announcements | Centralized announcements |
| Manual merchandise tracking | Inventory management |
| Volunteer group chats | Structured task management |
| Separate finance records | Centralized financial tracking |
| Multiple disconnected tools | One operating system |

---

# 🏗️ System Architecture

CampusFlow follows a separated full-stack architecture.

```text
                    ┌────────────────────────┐
                    │        Frontend        │
                    │ React + Vite + TS      │
                    │ Tailwind CSS            │
                    └────────────┬───────────┘
                                 │
                              HTTP/API
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │         Backend        │
                    │ Node.js + Express      │
                    │ TypeScript              │
                    └────────────┬───────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              ┌───────────┐            ┌────────────┐
              │  Prisma   │            │ External   │
              │    ORM    │            │ Services   │
              └─────┬─────┘            └────────────┘
                    │
                    ▼
              ┌─────────────┐
              │ PostgreSQL  │
              └─────────────┘
```

---

# 🛠️ Tech Stack

The implementation uses the technologies actually present in the repository.

### Frontend

- **React 19**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **React Router**
- **TanStack React Query**
- **Axios**
- **Lucide React**

### Backend

- **Node.js**
- **Express**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT**
- **Zod**
- **bcryptjs**
- **Helmet**
- **CORS**
- **Express Rate Limit**

### Payments & Ticketing

- **Razorpay**
- **QRCode**

### API & Development

- **Swagger UI**
- **Vitest**
- **Supertest**
- **ESLint**
- **Prettier**
- **Oxlint**

### Deployment

- **Vercel** for the live frontend
- Backend and database are configured separately through environment-based deployment architecture.

> The repository's package configuration is the source of truth for the technology stack.

---

# 🔐 Security

Security was considered as part of the backend architecture.

CampusFlow includes security-oriented mechanisms such as:

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Role-aware authorization
- Zod request validation
- Helmet security headers
- CORS configuration
- API rate limiting
- Environment-based secrets
- Controlled access to organization data

Sensitive credentials are never intended to be committed to the repository.

---

# 💳 Payment Architecture

CampusFlow integrates **Razorpay** for payment-related workflows.

The intended flow is:

```text
User
 │
 ▼
Select Product / Ticket
 │
 ▼
Create Payment Order
 │
 ▼
Razorpay Checkout
 │
 ▼
Payment Verification
 │
 ▼
Application Records Transaction
 │
 ▼
Ticket / Order Confirmation
```

Payment secrets are supplied through environment variables rather than stored in source code.

---

# 🎫 Event & QR Workflow

One of the important workflows in CampusFlow is digital event participation.

```text
                EVENT
                  │
                  ▼
          User selects event
                  │
                  ▼
            Ticket purchase
                  │
                  ▼
           Payment workflow
                  │
                  ▼
          Digital ticket issued
                  │
                  ▼
              QR Code
                  │
                  ▼
            Event check-in
```

This provides a much more structured alternative to manually maintaining attendee lists.

---

# 📁 Repository Structure

```text
CampusFlow/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── docs/
│   ├── design/
│   ├── product/
│   ├── reference/
│   └── delivery/
│
├── DESIGN.md
├── SECURITY.md
├── project_context.md
├── Student_Organization_System.pdf
└── README.md
```

---

# 🔌 Backend API

The backend is implemented as a dedicated Express API.

It provides the application layer responsible for:

- Authentication
- Organization operations
- Member workflows
- Events
- Ticketing
- Payments
- Merchandise
- Inventory
- Tasks
- Financial operations
- Data validation

API documentation is supported through **Swagger UI** in the backend.

---

# 🧪 Testing & Code Quality

The project includes dedicated development tooling for maintaining code quality.

### Frontend

```bash
npm run build
npm run lint
npm run test
```

### Backend

```bash
npm run build
npm run typecheck
npm run lint
npm run test
```

Database-related commands are also provided through Prisma:

```bash
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:seed
npm run db:studio
```

---

# 🚀 Run Locally

## Prerequisites

Make sure you have:

- Node.js 20+
- npm
- PostgreSQL
- Git

---

## 1. Clone the repository

```bash
git clone https://github.com/prtspndy/CampusFlow.git
cd CampusFlow
```

---

## 2. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## 3. Install backend dependencies

```bash
cd ../backend
npm install
```

---

## 4. Configure environment variables

Create the required environment files according to the backend/frontend configuration.

Typical backend configuration may include values such as:

```env
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

> **Never commit real credentials, API keys, database URLs, or secrets to Git.**

---

## 5. Generate Prisma client

```bash
cd backend
npm run db:generate
```

---

## 6. Configure the database

Run the required Prisma migration:

```bash
npm run db:migrate
```

If seed data is configured:

```bash
npm run db:seed
```

---

## 7. Start the backend

```bash
npm run dev
```

---

## 8. Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

The frontend will then be available through the Vite development server.

---

# 🌐 Live Demo

## 🚀 Try CampusFlow

**Live Application:**  

https://campusflow-os.vercel.app/

**Source Code:**  

https://github.com/prtspndy/CampusFlow

---

# 🎬 Demo Video

Watch the complete walkthrough of CampusFlow, including the platform experience and core student-organization workflows.

▶️ **[Watch CampusFlow Demo Video](https://youtu.be/O_EZjerq9rk)**

**YouTube:**  

https://youtu.be/O_EZjerq9rk

---

# 🎬 Recommended Judge Demo Flow

For judges, the fastest way to understand CampusFlow is to follow one complete organization workflow:

```text
1. Organization Dashboard
          ↓
2. Members
          ↓
3. Create / Explore Event
          ↓
4. Ticket Workflow
          ↓
5. Payment
          ↓
6. Digital Ticket + QR
          ↓
7. Event Check-in
          ↓
8. Merchandise / Orders
          ↓
9. Tasks / Volunteers
          ↓
10. Finance & Organization Overview
```

This demonstrates how CampusFlow connects different operational areas instead of treating them as isolated features.

---

# 🏅 Hackathon Highlights

### 🎯 Real-world Problem

Student organizations genuinely deal with fragmented operational workflows.

### 🔗 One Connected Platform

CampusFlow connects members, events, ticketing, merchandise, tasks, and finance.

### 💳 Real Payment Architecture

Razorpay integration enables a practical payment workflow.

### 🎫 QR-Based Event Workflow

Digital tickets and QR-based processes make event participation more structured.

### 🔐 Security-Aware Backend

Authentication, password hashing, validation, security headers, CORS, and rate limiting are part of the backend architecture.

### 🧩 Modular Full-Stack Architecture

Frontend and backend are separated, making the application easier to evolve.

### 📱 Product-Oriented UX

CampusFlow is designed as a modern SaaS-style product rather than a traditional college administration portal.

---

# 🧭 Product Vision

CampusFlow can grow beyond a single college club.

The long-term vision is a platform where colleges and student organizations can manage their complete digital operations from one system.

Potential future directions include:

- Multi-organization support
- College-level administration
- Advanced analytics
- Automated financial reporting
- Event recommendations
- Communication automation
- Attendance insights
- Organization performance metrics
- Mobile applications
- Deeper payment integrations
- AI-powered organization assistance

---

# 📌 Project Status

**Hackathon Release — Live**

CampusFlow is a functional full-stack product developed during a 24-hour hackathon.

The repository contains the application source code, backend services, frontend application, database architecture, documentation, and supporting project material.

---

# 👨‍💻 Team

Built with ❤️ during a 24-hour hackathon.

**CampusFlow Team**

> We didn't want to build another CRUD dashboard.
>
> **We wanted to build something a real student organization could actually use.**

---

# 📄 License

This project is provided under the license included in the repository.

---

<p align="center">

### 🎓 CampusFlow

**One platform. One organization. Zero operational chaos.**

<br/>

<a href="https://campusflow-os.vercel.app/">
<strong>🚀 Try CampusFlow</strong>
</a>

&nbsp;&nbsp;•&nbsp;&nbsp;

<a href="https://youtu.be/O_EZjerq9rk">
<strong>🎬 Watch Demo</strong>
</a>

</p>
