# CampusFlow Frontend — The Operating System for Student Organizations

A modern, high-performance web application built from scratch with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**. Faithfully adheres to the **Google Stitch Design Project 15963405480859296905** ("*Skyline Nocturne ERP*") and connects strictly to the production CampusFlow Express backend across all 99 registered API routes and four-role RBAC architecture.

---

## Architecture Overview

```
frontend/
├── public/                 # Static assets, SVG logo, favicon
├── src/
│   ├── app/                # Root shell, TanStack Query client, theme/auth providers, routing
│   │   ├── App.tsx
│   │   ├── providers.tsx
│   │   └── router.tsx
│   ├── components/         # Reusable presentation layer
│   │   ├── feedback/       # Alerts, banners, progress bars
│   │   ├── layout/         # AppLayout, AuthLayout, Navbar, Sidebar
│   │   ├── navigation/     # ProtectedRoute, RequireAuth, RequireGuest, RequireRole
│   │   └── ui/             # Badge, Button, Card, Modal, ConfirmDialog, Table, Input, Select, Skeleton, EmptyState
│   ├── config/             # Environment, permissions matrix, and role-based navigation configs
│   ├── context/            # AuthContext (token rotation), ThemeContext (dark/light dual-mode)
│   ├── features/           # Feature pages & domain views
│   │   ├── announcements/  # Feed, draft creator, audience targeting
│   │   ├── auth/           # Login (with quick role switcher), Register
│   │   ├── dashboard/      # Role-specific workspaces (Member, Admin, Event Manager, Treasurer)
│   │   ├── error/          # 404 Not Found, 403 Forbidden
│   │   ├── events/         # Public catalog, event details, checkout modal, attendee roster
│   │   ├── expenses/       # Reimbursement claims, receipt upload, staff audit & settlement
│   │   ├── fundraisers/    # Campaigns, donation modal, personal contribution ledger
│   │   ├── home/           # Skyline Nocturne landing page
│   │   ├── memberships/    # Tier passes, application modal, renewal, admin approval
│   │   ├── merchandise/    # Product store, size-level inventory, admin product management
│   │   ├── orders/         # Customer orders, status tracking, cancellations
│   │   ├── profile/        # Profile editing, RBAC permission badges
│   │   ├── tickets/        # QR digital boarding pass, staff check-in gate scanner
│   │   ├── treasury/       # ERP financial ledger, category breakdown, authenticated CSV export
│   │   ├── users/          # Admin user directory, role transitions, last-admin safeguards
│   │   └── volunteers/     # Shifts, self-service signups, attendance marking
│   ├── lib/                # API client (Axios), error envelopes, INR currency/date formatters
│   ├── services/           # 15 dedicated domain API services
│   ├── styles/             # main.css with Tailwind base & Stitch color variables
│   ├── test/               # Vitest test suite and test setup
│   └── types/              # Strict TypeScript definitions matching backend contracts
├── index.html              # HTML shell with Google Fonts & Razorpay checkout script
├── package.json
├── tailwind.config.js      # Stitch Nocturne ERP design tokens & palette
├── tsconfig.app.json       # Strict TypeScript configuration
└── vite.config.ts          # Vite + Vitest bundler configuration
```

---

## Design System: Google Stitch "Skyline Nocturne ERP"

- **Visual Baseline**: Google Stitch Project `15963405480859296905`.
- **Canvas Palette**:
  - Dark Canvas: `#111625`
  - Dark Surface: `#171D2B`
  - Dark Elevated: `#1D2536`
  - Border Subtle: `rgba(255, 255, 255, 0.10)`
- **Brand Accents**:
  - Primary Electric Blue: `#0047FF` (hover `#0038CC`)
  - Accent Cyan: `#38BDF8`
  - Status Success: `#10B981` / `#34D399`
  - Status Warning: `#F59E0B` / `#FBBF24`
  - Status Error: `#EF4444` / `#F87171`
- **Typography Scale**:
  - Headings: `Plus Jakarta Sans`
  - Body: `Inter`
  - Financial, Tokens, & IDs: `JetBrains Mono` with `.tabular-nums`
- **Dual-Mode Theming**:
  - Defaults to Dark Mode (*Skyline Nocturne*).
  - Instant toggle to Light Mode via Sun/Moon switcher in the top Navbar. Persisted across reloads in `localStorage`.

---

## Role-Based Access Control (RBAC)

The application enforces fine-grained authorization matching the backend's four roles:

| Role | Default Route | Workspace Features |
|---|---|---|
| **`ADMIN`** | `/dashboard` | System oversight, full user directory & role reassignment, membership approval, treasury ledger audit, event roster oversight. |
| **`EVENT_MANAGER`** | `/dashboard` | Event publishing, ticket check-in gate scanner, attendee roster export, volunteer shift management, announcements broadcasting. |
| **`TREASURER`** | `/dashboard` | Treasury summary KPIs, financial ledger, expense claim audit & approval, reimbursement settlements (UTR), fundraisers management, CSV ledger export. |
| **`MEMBER`** | `/dashboard` | Membership pass purchase & renewal, event registration, Razorpay payments, QR tickets, merch storefront, shift volunteering, out-of-pocket claim filing. |

### Quick Demo Seed Accounts
On the `/login` page, convenient single-click seed credential buttons are available for all four canonical test accounts (Password: `Password1`):
1. **Admin**: `admin@campus.edu`
2. **Event Manager**: `eventmanager@campus.edu`
3. **Treasurer**: `treasurer@campus.edu`
4. **Member**: `member@campus.edu`

---

## Real Backend API Integration

- **API Base URL**: `http://localhost:5000/api`
- **Zero Mock Fallbacks**: Every page, form, table, filter, and action dispatches real HTTP calls through Axios to the Express backend.
- **Envelope Parsing**: Adheres strictly to the backend's `{ success: boolean, message?: string, data?: T, error?: ApiErrorPayload }` structure.
- **Authentication Lifecycle**:
  - Short-lived JWT stored in-memory.
  - Opaque refresh token persisted in `sessionStorage`.
  - Axios response interceptor intercepts 401s and executes single-flight refresh requests, queuing concurrent calls to prevent token thrashing.
  - Automatically dispatches `session-expired` on terminal failures to return user safely to `/login`.
- **Payment Lifecycle**:
  - Events check `requiresPayment`. Free events confirm instantaneously.
  - Paid events generate an order ID from the backend and launch the Razorpay Checkout modal, verifying the payment signature on completion.
- **Treasury CSV Export**:
  - Consumes `/api/finance/export` as a binary `Blob` with authenticated JWT headers and initiates a browser file download.
- **Separation of Duties**:
  - Submitter cannot self-approve their own expense claims or self-settle reimbursements. The frontend detects and surfaces actionable error banners from the backend.

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Backend Service**: Ensure the CampusFlow Express backend is running on `http://localhost:5000`.

### Installation

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure `.env` is configured (defaults to local backend):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_APP_NAME=CampusFlow
   VITE_RAZORPAY_KEY_ID=rzp_test_mock_campusflow
   ```

### Running Locally

- **Development Server**:
  ```bash
  npm run dev
  ```
  Launches Vite at `http://localhost:5173`.

- **Type Check**:
  ```bash
  npx tsc --noEmit
  ```

- **Run Tests**:
  ```bash
  npm test
  ```

- **Production Build**:
  ```bash
  npm run build
  ```
  Generates an optimized, minified bundle in `dist/`.

- **Production Preview**:
  ```bash
  npm run preview
  ```
