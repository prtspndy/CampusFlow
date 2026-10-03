# CampusFlow — Complete Backend Architecture & API Reference Manual

**Authoritative Backend Specification for Frontend & Full-Stack Engineers**  
**Version:** 1.0.0 (Phases 00–05 Production Ready)  
**Repository:** `https://github.com/prtspndy/CampusFlow`  
**Base API Endpoint:** `/api`  
**Protocol:** REST over HTTPS / JSON Envelopes  

---

# Section A — Project Overview

## A.1 Project Purpose
CampusFlow is a unified student organization management platform built for modern university club governance, event coordination, member administration, inventory commerce, and financial accountability. It provides end-to-end management for university organizations, eliminating disparate spreadsheets, informal payment tracking, and manual attendance rosters.

## A.2 Actual Technology Stack
The backend is structured as a decoupled, modular TypeScript service:

| Layer | Technology | Details |
|---|---|---|
| **Runtime** | Node.js (>= 20.0.0) | Asynchronous non-blocking runtime |
| **Framework** | Express 4.21.2 | Lightweight HTTP server with routing middleware |
| **Language** | TypeScript 5.7.3 | Strict type definitions, target ES2022 |
| **Database** | PostgreSQL (Neon DB) | Serverless PostgreSQL with pooling (`pgbouncer`) |
| **ORM & Migrations** | Prisma 6.4.1 | Schema generation, client types, transactional safety |
| **Authentication** | Custom JWT + Opaque Refresh Tokens | HS256 JWT, SHA-256 opaque refresh token rotation in database |
| **Password Hashing** | bcryptjs 3.0.3 | 12 salt rounds (production), 4 salt rounds (test) |
| **Validation** | Zod 3.24.2 | Strict schema parsing on body, params, query |
| **Payments** | Razorpay Node SDK 2.9.8 | HMAC-SHA256 signature verification & webhooks |
| **QR Code Generation** | qrcode 1.5.4 | Digital attendance check-in token encoding |
| **Security Headers** | Helmet 8.0.0 | CSP, XSS protection, MIME sniffing protection |
| **CORS** | cors 2.8.5 | Dynamic origin validation against `FRONTEND_URL` |
| **Rate Limiting** | express-rate-limit 8.7.0 | IP-based request throttling on authentication routes |
| **Documentation** | swagger-ui-express 5.0.1 | OpenAPI 3.0.3 interactive schema interface |
| **Test Runner** | Vitest 3.0.5 + Supertest 7.0.0 | Unit, integration, mock-memory, and PostgreSQL tests |

## A.3 Backend Architecture & Request Flow

```mermaid
flowchart TD
    Client["Browser / Frontend Client"]
    ReverseProxy["Reverse Proxy / CDN / Hosting"]
    Helmet["Helmet Security Middleware"]
    CORS["CORS Origin Validation"]
    ReqID["Request ID (UUIDv4) Injection"]
    BodyParsers["Raw & JSON Body Parsers"]
    Router["Root Router (/api)"]
    
    subgraph Middleware Pipeline
        AuthMW["Authentication Middleware (JWT Bearer)"]
        RBACMW["RBAC Middleware (requireRole / requirePermission)"]
        ValMW["Zod Validation (Body / Params / Query)"]
    end

    subgraph Service Layer
        AuthSvc["Auth & Token Service"]
        MemberSvc["Membership Service"]
        EventSvc["Event Service"]
        TicketSvc["Ticketing & Check-In Service"]
        PaySvc["Razorpay Payment Service"]
        MerchSvc["Product & Order Service"]
        VolSvc["Volunteer Service"]
        FundSvc["Fundraiser Service"]
        FinSvc["Expense, Reimbursement & Ledger Service"]
    end

    subgraph Data Layer
        PrismaClient["Prisma Client ORM"]
        NeonDB[("Neon PostgreSQL Database")]
    end

    Client --> ReverseProxy
    ReverseProxy --> Helmet
    Helmet --> CORS
    CORS --> ReqID
    ReqID --> BodyParsers
    BodyParsers --> Router
    Router --> AuthMW
    AuthMW --> RBACMW
    RBACMW --> ValMW
    ValMW --> ServiceLayer
    
    AuthSvc --> PrismaClient
    MemberSvc --> PrismaClient
    EventSvc --> PrismaClient
    TicketSvc --> PrismaClient
    PaySvc --> PrismaClient
    MerchSvc --> PrismaClient
    VolSvc --> PrismaClient
    FundSvc --> PrismaClient
    FinSvc --> PrismaClient
    
    PrismaClient --> NeonDB
```

## A.4 Main Modules
1. **Foundation & Observability:** Liveness, readiness (`SELECT 1`), Swagger UI, standardized envelopes.
2. **Authentication & Session Security:** Registration, sign-in, token refresh rotation, single-device/multi-device logout, profile access.
3. **Canonical Four-Role RBAC:** `ADMIN`, `EVENT_MANAGER`, `TREASURER`, `MEMBER`.
4. **Organization Membership:** Membership tiers (`annual`, `semester`, `lifetime`), status lifecycles, renewal tracking, digital membership codes (`CF-YYYY-XXXX`).
5. **Events & Registrations:** Event publishing lifecycle, free & paid registration reservations, seat capacity preservation, tier-based pricing.
6. **Ticketing, Cryptography & Attendance Check-In:** Encrypted QR credentials (AES-GCM ciphertext + SHA-256 hash), atomic check-in execution, check-in history.
7. **Payment Processing & Webhook Security:** Razorpay order creation, authoritative amount calculation, HMAC SHA-256 signature verification, idempotent webhook processing.
8. **Merchandise & Stock Management:** Product catalogue, variant size tracking, atomic stock reservations, idempotent order placement.
9. **Announcements:** Broadcast notifications, audience targeting, draft/publish lifecycle.
10. **Volunteer Opportunities:** Shift scheduling, application deadlines, atomic slot reservations, attendance tracking (`ATTENDED`, `NO_SHOW`, `EXCUSED`).
11. **Fundraisers & Verified Contributions:** Goal monitoring, verified-only collection aggregates, cash/direct contribution tracking, online Razorpay donations.
12. **Expenses & Reimbursements:** Financial separation of duties, self-approval prevention, self-settlement prevention, status auditing (`PENDING`, `APPROVED`, `REJECTED`, `SETTLED`).
13. **Treasury Ledger & Financial Reporting:** Unified double-entry cash flow ledger (tickets, merch, fundraisers, reimbursements), RFC 4180 CSV export with formula injection sanitization.

## A.5 Role System
The system enforces four canonical roles:
- `ADMIN`: Full authority across user management, role assignments, event oversight, financial approvals, merchandise stock, and organization settings.
- `EVENT_MANAGER`: Authority to create/manage events, validate tickets, check in attendees, organize volunteer opportunities, and initiate fundraisers.
- `TREASURER`: Authority over financial oversight, payment reconciliation, expense review, reimbursement settlement, and treasury reporting.
- `MEMBER`: General student/member account with access to sign up for events, volunteer shifts, store orders, fundraisers, and expense submissions.

## A.6 Backend Completion Status
All requirements across Phases 00 through 05 are implemented, covered by 148 passing test cases, fully typed with TypeScript, passing ESLint with zero warnings, and verified against Neon PostgreSQL migrations.

---

# Section B — Setup Guide

## B.1 Prerequisites
- **Node.js:** v20.0.0 or higher
- **npm:** v10.0.0 or higher
- **Git:** Installed
- **PostgreSQL Database:** A running PostgreSQL instance or a hosted Neon PostgreSQL database connection string.

## B.2 Step-by-Step Installation
1. Clone the repository and navigate to the backend directory:
   ```bash
   cd D:\Projects\CampusFlow\backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   copy .env.example .env
   ```
   Edit `.env` to supply `DATABASE_URL`, `DIRECT_URL`, and development secrets.

4. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```
5. Validate Prisma Schema:
   ```bash
   npm run db:validate
   ```
6. Check database migration status (read-only):
   ```bash
   npx prisma migrate status
   ```
   *(Note: Migrations must be deployed safely using `npx prisma migrate deploy`. Never run `prisma migrate reset` on a shared database.)*

7. Verify TypeScript type checking:
   ```bash
   npm run typecheck
   ```
8. Verify code linting:
   ```bash
   npm run lint
   ```
9. Execute automated test suites:
   ```bash
   npm run test
   ```
10. Start the development server with live reload:
    ```bash
    npm run dev
    ```
    The server will listen at `http://localhost:5000` with Swagger docs available at `http://localhost:5000/api/docs`.

11. Compile production build:
    ```bash
    npm run build
    npm start
    ```

## B.3 Health Check Verification
- **Liveness Probe:**
  ```bash
  curl http://localhost:5000/api/health
  # Response: {"success":true,"message":"Service is healthy","data":{"status":"UP",...}}
  ```
- **Readiness Probe:**
  ```bash
  curl http://localhost:5000/api/health/ready
  # Response: {"success":true,"message":"Service is ready","data":{"status":"READY","database":"CONNECTED",...}}
  ```

---

# Section C — Environment Variables Reference

| Variable Name | Purpose | Required? | Applicable Env | Safe Placeholder Example | Consequences if Missing / Invalid |
|---|---|:---:|:---:|---|---|
| `NODE_ENV` | Application runtime environment | Optional | All | `development` | Defaults to `development`. In production, strict security validations are activated. |
| `PORT` | Local HTTP port | Optional | All | `5000` | Defaults to 5000. |
| `API_PREFIX` | Base URI routing prefix | Optional | All | `/api` | Defaults to `/api`. |
| `FRONTEND_URL` | Comma-separated CORS allowed client origins | Required in Prod | Dev / Prod | `http://localhost:5173,http://localhost:3000` | Defaults to `http://localhost:5173`. Cross-origin browser requests from unlisted domains fail. |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string | Required | All | `postgresql://user:pass@ep-host-pooler.neon.tech/neondb?sslmode=require` | Database queries fail; readiness check returns HTTP 503. |
| `DIRECT_URL` | Direct unpooled PostgreSQL connection string for Prisma migrations | Optional | All | `postgresql://user:pass@ep-host.neon.tech/neondb?sslmode=require` | Schema migrations may fail on connection poolers. |
| `JWT_ACCESS_SECRET` | 32+ character key for signing access tokens | Required | All | `replace-with-at-least-32-characters-secure-secret-key-1234` | App exits on startup if < 32 characters in non-test mode. |
| `JWT_ACCESS_TTL_SECONDS` | Access token lifetime in seconds | Optional | All | `900` | Defaults to 900 seconds (15 minutes). |
| `JWT_REFRESH_TTL_DAYS` | Refresh token lifetime in days | Optional | All | `7` | Defaults to 7 days. |
| `JWT_ISSUER` | JWT issuer (`iss`) claim | Optional | All | `campusflow` | Defaults to `campusflow`. |
| `JWT_AUDIENCE` | JWT audience (`aud`) claim | Optional | All | `campusflow-api` | Defaults to `campusflow-api`. |
| `BCRYPT_ROUNDS` | Salt work factor for password hashing | Optional | All | `12` | Defaults to 12 (4 in test). |
| `AUTH_RATE_LIMIT_MAX` | Max requests per rate limit window | Optional | All | `10` | Defaults to 10 requests per 15 minutes on auth routes. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | Optional | All | `900000` | Defaults to 900,000 ms (15 minutes). |
| `TICKET_ENCRYPTION_KEY` | 32+ character key for AES-GCM QR credential encryption | Required in Prod | All | `replace-with-at-least-32-char-encryption-key-for-tickets` | In production, startup fails if < 32 chars. In dev, falls back to dev key. |
| `RAZORPAY_KEY_ID` | Public API key ID for Razorpay client SDK | Optional | All | `rzp_test_campusflow123` | Online event payments & donations cannot initialize order. |
| `RAZORPAY_KEY_SECRET` | Secret API key for Razorpay signature validation | Optional | All | `replace-with-razorpay-key-secret-32-chars` | Server-side payment signature verification cannot execute. |
| `RAZORPAY_WEBHOOK_SECRET` | Secret key for Razorpay webhook validation | Optional | All | `replace-with-razorpay-webhook-secret-32-chars` | Webhook requests return HTTP 400 Invalid Signature. |

---

# Section D — Authentication & Session Security

## D.1 Token Architecture
- **Access Tokens:** Short-lived signed JSON Web Tokens (JWT) containing `sub` (User UUID), `tv` (Token Version integer), `typ` (`"access"`), `iss` (`"campusflow"`), `aud` (`"campusflow-api"`), and standard expiry. Sensitive personal data (email, name, role) is omitted from the JWT payload to protect privacy.
- **Refresh Tokens:** High-entropy opaque strings generated using `node:crypto.randomBytes(32).toString('base64url')`. Only a SHA-256 hash of the token is persisted in the database.
- **Token Family & Rotation:** Every refresh token belongs to a `familyId`. When `POST /api/auth/refresh` is called:
  1. The presented token is hashed and looked up in the database.
  2. If the token was already revoked, a replay attack is detected and **all tokens in that family are immediately revoked**.
  3. Otherwise, an atomic conditional update marks the token `revokedAt = NOW()` and issues a new refresh token under the same `familyId`.
- **Global Logout:** `POST /api/auth/logout` atomically increments `tokenVersion` on the User model and revokes all active refresh tokens for that user. Any existing access token is immediately rejected upon its next use with `401 TOKEN_REVOKED`.

## D.2 Authentication Endpoints

### 1. Register User
- **Method & Path:** `POST /api/auth/register`
- **Auth:** None (Public)
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Ada Lovelace",
    "email": "ada@campus.edu",
    "password": "Password123!"
  }
  ```
- **Validation Constraints:** `name` (1–80 chars), `email` (valid email, normalized lowercase), `password` (8–72 chars, requires at least 1 letter and 1 number). Rejects arbitrary extra fields (`role`, `status`, `passwordHash`) with `422 VALIDATION_ERROR`.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "id": "c1f7a4e2-892b-4c07-9b21-4f7f6b98e1a1",
      "email": "ada@campus.edu",
      "name": "Ada Lovelace",
      "role": "MEMBER",
      "roleDisplayName": "Club Member / Student",
      "permissions": [
        "profile.read_own",
        "profile.update_own",
        "organization.read",
        "memberships.read_own",
        "memberships.purchase",
        "memberships.renew_own",
        "events.read",
        "tickets.read_own",
        "announcements.read",
        "merchandise.read",
        "orders.create",
        "orders.read_own",
        "fundraisers.read",
        "fundraisers.contribute",
        "volunteers.read",
        "volunteers.signup",
        "finance.expenses.create",
        "finance.expenses.read_own",
        "reimbursements.read_own"
      ],
      "status": "active",
      "createdAt": "2026-10-03T12:00:00.000Z",
      "updatedAt": "2026-10-03T12:00:00.000Z"
    }
  }
  ```
- **Errors:** `409 CONFLICT` (Email already exists), `422 VALIDATION_ERROR`, `429 RATE_LIMITED`.

### 2. Login User
- **Method & Path:** `POST /api/auth/login`
- **Auth:** None (Public)
- **Request Body:**
  ```json
  {
    "email": "ada@campus.edu",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Signed in successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "dGhpcy1pcy1hLXJhbmRvbS1yZWZyZXNoLXRva2Vu...",
      "expiresIn": 900,
      "user": {
        "id": "c1f7a4e2-892b-4c07-9b21-4f7f6b98e1a1",
        "email": "ada@campus.edu",
        "name": "Ada Lovelace",
        "role": "MEMBER",
        "roleDisplayName": "Club Member / Student",
        "permissions": [ /* array of permissions */ ],
        "status": "active",
        "createdAt": "2026-10-03T12:00:00.000Z",
        "updatedAt": "2026-10-03T12:00:00.000Z"
      }
    }
  }
  ```
- **Errors:** `401 INVALID_CREDENTIALS` (Generic error returned for non-existent email, wrong password, or disabled account to prevent user enumeration), `422 VALIDATION_ERROR`, `429 RATE_LIMITED`.

### 3. Refresh Session
- **Method & Path:** `POST /api/auth/refresh`
- **Auth:** None (Requires valid refresh token in body)
- **Request Body:**
  ```json
  {
    "refreshToken": "dGhpcy1pcy1hLXJhbmRvbS1yZWZyZXNoLXRva2Vu..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Session refreshed successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "bmV3LXJhbmRvbS1yZWZyZXNoLXRva2VuLXZhbHVl...",
      "expiresIn": 900,
      "user": { /* public user object */ }
    }
  }
  ```
- **Errors:** `401 INVALID_REFRESH_TOKEN` (Expired, invalid, or replayed token).

### 4. Logout User
- **Method & Path:** `POST /api/auth/logout`
- **Auth:** `Bearer <access_token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Signed out successfully",
    "data": null
  }
  ```

### 5. Get Current Authenticated Profile
- **Method & Path:** `GET /api/auth/me`
- **Auth:** `Bearer <access_token>`
- **Response (200 OK):** Returns the current user's profile with role, display name, and active permissions array.

### 6. Update Current Profile Name
- **Method & Path:** `PATCH /api/auth/me`
- **Auth:** `Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "name": "Ada Augusta King"
  }
  ```
- **Response (200 OK):** Returns updated public user object. Rejects attempts to modify `email`, `role`, or `status`.

---

# Section E — Complete Endpoint Inventory (99 Registered Routes)

### E.1 System & Health Probes
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `GET /api` | Public | API discovery & version | None | `200` with service metadata |
| `GET /api/health` | Public | Process liveness probe | None | `200` with `status: UP` |
| `GET /api/health/ready` | Public | Database readiness probe | None | `200` with `status: READY` or `503` if DB disconnected |
| `GET /api/docs` | Public | Interactive Swagger UI | None | `200` HTML |
| `GET /api/docs.json` | Public | OpenAPI JSON specification | None | `200` JSON specification |

### E.2 Authentication & User Governance
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `POST /api/auth/register` | Public | Register new member account | `name`, `email`, `password` | `201`, `409`, `422`, `429` |
| `POST /api/auth/login` | Public | Authenticate user & issue tokens | `email`, `password` | `200`, `401`, `422`, `429` |
| `POST /api/auth/refresh` | Public | Rotate refresh token & issue new JWT | `refreshToken` | `200`, `401`, `422`, `429` |
| `POST /api/auth/logout` | Authenticated | Revoke all active sessions & token version | None | `200`, `401` |
| `GET /api/auth/me` | Authenticated | Retrieve current user profile & permissions | None | `200`, `401` |
| `PATCH /api/auth/me` | Authenticated | Update user's own display name | `name` | `200`, `401`, `422` |
| `GET /api/users/:userId` | Self or `ADMIN` | Retrieve user profile by UUID | Param: `userId` | `200`, `403`, `404`, `422` |
| `GET /api/admin/users` | `ADMIN` | List all users (max 100) | None | `200`, `401`, `403` |
| `PATCH /api/admin/users/:userId/role` | `ADMIN` | Assign role (protects last active admin) | Param: `userId`, Body: `role` | `200`, `400`, `403`, `404` |

### E.3 Organization Memberships
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `POST /api/memberships` | Authenticated | Apply for or initiate membership | Body: `planName`, `notes?` | `201`, `400`, `401`, `409` |
| `POST /api/memberships/apply` | Authenticated | Alias for membership application | Body: `planName`, `notes?` | `201`, `400`, `401`, `409` |
| `GET /api/memberships/me` | Authenticated | List caller's membership passes | None | `200`, `401` |
| `GET /api/memberships` | `ADMIN`, `TREASURER` | Paginated search of club memberships | Query: `status`, `search`, `page`, `limit` | `200`, `401`, `403` |
| `GET /api/memberships/:membershipId` | Owner, `ADMIN`, `TREASURER` | Get single membership record | Param: `membershipId` | `200`, `403`, `404` |
| `POST /api/memberships/:membershipId/renew` | Owner, `ADMIN`, `TREASURER` | Renew active/expired membership | Param: `membershipId`, Body: `planName?` | `200`, `400`, `403`, `404` |
| `PATCH /api/memberships/:membershipId/status` | `ADMIN` | Transition status (`ACTIVE`, `SUSPENDED`, etc.) | Param: `membershipId`, Body: `status`, `adminNotes?` | `200`, `400`, `403`, `404` |

### E.4 Events Management
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `POST /api/events` | `ADMIN`, `EVENT_MANAGER` | Create event in `DRAFT` status | `title`, `description`, `venue`, `startsAt`, `endsAt`, `memberPrice`, `standardPrice`, `totalCapacity` | `201`, `401`, `403`, `422` |
| `GET /api/events` | Public / Optional Auth | List events (`PUBLISHED` for public, drafts for staff) | Query: `status`, `category`, `search`, `page`, `limit` | `200` |
| `GET /api/events/:eventId` | Public / Optional Auth | Get event details | Param: `eventId` | `200`, `404` |
| `PATCH /api/events/:eventId` | Creator or `ADMIN` | Update event attributes | Param: `eventId`, Body: fields to update | `200`, `400`, `403`, `404` |
| `POST /api/events/:eventId/publish` | Creator or `ADMIN` | Transition event to `PUBLISHED` | Param: `eventId` | `200`, `400`, `403`, `404` |
| `POST /api/events/:eventId/cancel` | Creator or `ADMIN` | Transition event to `CANCELLED` | Param: `eventId` | `200`, `400`, `403`, `404` |

### E.5 Event Registrations & Rosters
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `POST /api/events/:eventId/registrations` | Authenticated | Register caller for event (free or paid) | Param: `eventId` | `201`, `400`, `401`, `409` |
| `GET /api/events/:eventId/registrations` | Event Organizer, `ADMIN` | List attendee roster for event | Param: `eventId`, Query: `status`, `page`, `limit` | `200`, `403`, `404` |
| `GET /api/registrations/me` | Authenticated | List caller's event registrations | Query: `page`, `limit` | `200`, `401` |
| `GET /api/registrations/:registrationId` | Owner, Organizer, `ADMIN` | View single registration record | Param: `registrationId` | `200`, `404` |
| `POST /api/registrations/:registrationId/cancel` | Owner, Organizer, `ADMIN` | Cancel registration and release seat | Param: `registrationId` | `200`, `400`, `404` |

### E.6 Tickets, QR Codes & Attendance Check-In
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `GET /api/tickets/me` | Authenticated | List caller's issued tickets | Query: `page`, `limit` | `200`, `401` |
| `GET /api/tickets/:ticketId` | Owner, Staff, `ADMIN` | Get ticket status | Param: `ticketId` | `200`, `404` |
| `GET /api/tickets/:ticketId/qr` | Owner Only | Get decrypted QR token & Data URL | Param: `ticketId` | `200`, `403`, `404` |
| `POST /api/events/:eventId/tickets/validate` | Organizer, `ADMIN` | Inspect ticket validity (read-only) | Param: `eventId`, Body: `token` | `200`, `403`, `422` |
| `POST /api/events/:eventId/check-in` | Organizer, `ADMIN` | Atomically check in attendee | Param: `eventId`, Body: `token` | `200`, `403`, `404`, `409` |
| `GET /api/events/:eventId/attendance` | Organizer, `ADMIN` | Paginated check-in audit logs | Param: `eventId`, Query: `page`, `limit` | `200`, `403`, `404` |

### E.7 Payments & Razorpay Webhooks
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `POST /api/registrations/:registrationId/payment-order` | Registration Owner | Create Razorpay payment order | Param: `registrationId` | `200`, `201`, `404`, `409`, `503` |
| `POST /api/payments/verify` | Authenticated Owner | Verify Razorpay payment signature & issue ticket | Body: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` | `200`, `400`, `404`, `409` |
| `POST /api/payments/webhook` | Public (Signature Verified) | Process Razorpay payment webhooks idempotently | Raw payload, Headers: `x-razorpay-signature`, `x-razorpay-event-id` | `200`, `400` |
| `GET /api/payments` | `ADMIN`, `TREASURER` | List payment transaction logs | Query: `eventId`, `page`, `limit` | `200`, `403` |
| `GET /api/payments/:paymentId` | Owner, `ADMIN`, `TREASURER` | Retrieve payment record details | Param: `paymentId` | `200`, `404` |

### E.8 Merchandise & Inventory Management
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `GET /api/products` | Public / Optional Auth | List merchandise catalogue | Query: `search`, `category`, `status`, `page`, `limit` | `200` |
| `POST /api/products` | `ADMIN` | Create new product and size inventory | Body: `name`, `description`, `category`, `memberPrice`, `standardPrice`, `variants` | `201`, `403`, `422` |
| `GET /api/products/:productId` | Public / Optional Auth | Get product details and size stock | Param: `productId` | `200`, `404` |
| `PATCH /api/products/:productId` | `ADMIN` | Update product details | Param: `productId`, Body: fields | `200`, `403`, `404` |
| `PATCH /api/products/:productId/stock` | `ADMIN` | Adjust variant inventory with optimistic lock | Param: `productId`, Body: `size`, `stock`, `expectedStock` | `200`, `409`, `422` |
| `POST /api/orders` | Authenticated | Place pickup merchandise order | Body: `items: [{productId, size, quantity}]`, `idempotencyKey?` | `200`, `201`, `409`, `422` |
| `GET /api/orders/me` | Authenticated | List caller's orders | Query: `page`, `limit` | `200`, `401` |
| `GET /api/orders` | `ADMIN`, `TREASURER` | List all member merchandise orders | Query: `page`, `limit`, `status` | `200`, `403` |
| `GET /api/orders/:orderId` | Order Owner, `ADMIN`, `TREASURER` | Get order details and item breakdown | Param: `orderId` | `200`, `404` |
| `POST /api/orders/:orderId/cancel` | Order Owner or `ADMIN` | Cancel placed order and restore stock | Param: `orderId` | `200`, `400`, `404` |

### E.9 Announcements
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `GET /api/announcements` | Public | List published announcements | Query: `search`, `audience`, `page`, `limit` | `200` |
| `GET /api/announcements/manage` | `ADMIN`, `EVENT_MANAGER` | List drafts manageable by caller | Query: `page`, `limit` | `200`, `403` |
| `POST /api/announcements` | `ADMIN`, `EVENT_MANAGER` | Create new announcement draft | Body: `title`, `body`, `audience` | `201`, `403`, `422` |
| `GET /api/announcements/:announcementId` | Public / Author / Staff | Get single announcement | Param: `announcementId` | `200`, `404` |
| `PATCH /api/announcements/:announcementId` | Author, `ADMIN` | Edit announcement | Param: `announcementId`, Body: fields | `200`, `403`, `404` |
| `POST /api/announcements/:announcementId/publish` | `ADMIN` | Publish announcement | Param: `announcementId` | `200`, `403`, `404` |
| `POST /api/announcements/:announcementId/unpublish` | `ADMIN` | Revert announcement to `DRAFT` | Param: `announcementId` | `200`, `403`, `404` |

### E.10 Volunteer Opportunities & Participation
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `GET /api/volunteers/opportunities` | Public / Optional Auth | List volunteer opportunities | Query: `status`, `category`, `eventId`, `search`, `page`, `limit` | `200` |
| `POST /api/volunteers/opportunities` | `ADMIN`, `EVENT_MANAGER` | Create volunteer opportunity | Body: `title`, `description`, `location`, `startsAt`, `endsAt`, `capacity`, `deadline?` | `201`, `403`, `422` |
| `GET /api/volunteers/signups/me` | Authenticated | List caller's volunteer registrations | None | `200`, `401` |
| `POST /api/volunteers/signups/:id/cancel` | Signup Owner, Staff | Cancel volunteer signup & free capacity slot | Param: `id` | `200`, `400`, `403`, `404` |
| `PATCH /api/volunteers/signups/:id/attendance` | `ADMIN`, `EVENT_MANAGER` | Record attendance (`ATTENDED`, `NO_SHOW`, `EXCUSED`) | Param: `id`, Body: `status`, `attendanceNotes?` | `200`, `403`, `404`, `422` |
| `GET /api/volunteers/opportunities/:id` | Public / Optional Auth | Get opportunity details & capacity | Param: `id` | `200`, `404` |
| `PATCH /api/volunteers/opportunities/:id` | `ADMIN`, `EVENT_MANAGER` | Update opportunity fields & capacity | Param: `id`, Body: fields | `200`, `400`, `403`, `404` |
| `POST /api/volunteers/opportunities/:id/publish` | `ADMIN`, `EVENT_MANAGER` | Transition opportunity to `PUBLISHED` | Param: `id` | `200`, `403`, `404` |
| `POST /api/volunteers/opportunities/:id/close` | `ADMIN`, `EVENT_MANAGER` | Close opportunity to further signups | Param: `id` | `200`, `403`, `404` |
| `POST /api/volunteers/opportunities/:id/cancel` | `ADMIN`, `EVENT_MANAGER` | Cancel volunteer opportunity | Param: `id` | `200`, `403`, `404` |
| `POST /api/volunteers/opportunities/:id/signups` | Authenticated | Register for volunteer shift (atomic concurrency check) | Param: `id`, Body: `notes?` | `201`, `400`, `409`, `422` |
| `GET /api/volunteers/opportunities/:id/participants` | `ADMIN`, `EVENT_MANAGER` | View participant roster & attendance | Param: `id` | `200`, `403`, `404` |

### E.11 Fundraisers & Verified Contributions
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `GET /api/fundraisers` | Public / Optional Auth | List fundraisers with verified aggregates | Query: `status`, `search`, `page`, `limit` | `200` |
| `POST /api/fundraisers` | `ADMIN`, `TREASURER`, `EVENT_MANAGER` | Create fundraiser campaign | Body: `title`, `description`, `goalAmount`, `purpose?`, `startsAt?`, `deadline?` | `201`, `403`, `422` |
| `GET /api/fundraisers/my-donations` | Authenticated | List caller's contributions | None | `200`, `401` |
| `POST /api/fundraisers/verify` | Public / Donors | Verify Razorpay payment signature for contribution | Body: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature` | `200`, `400`, `404` |
| `GET /api/fundraisers/:id` | Public / Optional Auth | Get fundraiser details & verified totals | Param: `id` | `200`, `404` |
| `PATCH /api/fundraisers/:id` | `ADMIN`, `TREASURER` | Update fundraiser settings | Param: `id`, Body: fields | `200`, `403`, `404` |
| `POST /api/fundraisers/:id/publish` | `ADMIN`, `TREASURER` | Publish fundraiser (`ACTIVE`) | Param: `id` | `200`, `403`, `404` |
| `POST /api/fundraisers/:id/close` | `ADMIN`, `TREASURER` | Close fundraiser (`CLOSED`) | Param: `id` | `200`, `403`, `404` |
| `POST /api/fundraisers/:id/contributions` | Public / Optional Auth | Record contribution (Cash or Online order) | Param: `id`, Body: `amount`, `donorName`, `donorEmail`, `paymentMethod`, `idempotencyKey?` | `201`, `400`, `404`, `422` |
| `GET /api/fundraisers/:id/contributions` | `ADMIN`, `TREASURER` | List verified donor ledger for campaign | Param: `id`, Query: `page`, `limit`, `status` | `200`, `403`, `404` |
| `GET /api/fundraisers/:id/summary` | Public / Donors | Get campaign financial summary | Param: `id` | `200`, `404` |

### E.12 Expenses & Reimbursements
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `POST /api/expenses` | Authenticated | Submit expense receipt for reimbursement | Body: `title`, `description`, `amount`, `category`, `expenseDate`, `receiptUrl?`, `eventId?`, `fundraiserId?` | `201`, `401`, `422` |
| `GET /api/expenses/me` | Authenticated | List caller's submitted expenses | None | `200`, `401` |
| `GET /api/expenses` | `ADMIN`, `TREASURER` | Review expense claims with filters | Query: `status`, `category`, `submitterId`, `startDate`, `endDate`, `page`, `limit` | `200`, `403` |
| `GET /api/expenses/:id` | Submitter, `ADMIN`, `TREASURER` | Get single expense claim & reimbursement link | Param: `id` | `200`, `403`, `404` |
| `PATCH /api/expenses/:id` | Submitter Only | Edit pending expense | Param: `id`, Body: fields | `200`, `400`, `403`, `404` |
| `DELETE /api/expenses/:id` | Submitter Only | Withdraw pending expense | Param: `id` | `200`, `400`, `403`, `404` |
| `POST /api/expenses/:id/approve` | `ADMIN`, `TREASURER` | Approve expense & auto-queue reimbursement claim (Separation of duties: rejects self-approval) | Param: `id` | `200`, `400`, `403` (`SELF_APPROVAL_FORBIDDEN`), `404` |
| `POST /api/expenses/:id/reject` | `ADMIN`, `TREASURER` | Reject expense claim with reason | Param: `id`, Body: `reason` | `200`, `400`, `403`, `404`, `422` |
| `GET /api/reimbursements/me` | Authenticated | List caller's reimbursement payouts | None | `200`, `401` |
| `GET /api/reimbursements` | `ADMIN`, `TREASURER` | List all reimbursement claims | Query: `status`, `claimantId`, `page`, `limit` | `200`, `403` |
| `GET /api/reimbursements/:id` | Claimant, `ADMIN`, `TREASURER` | Get reimbursement payout details | Param: `id` | `200`, `403`, `404` |
| `POST /api/reimbursements/:id/settle` | `ADMIN`, `TREASURER` | Record payout disbursement (Separation of duties: rejects self-settlement) | Param: `id`, Body: `settlementReference`, `notes?` | `200`, `400`, `403` (`SELF_SETTLEMENT_FORBIDDEN`), `404` |
| `POST /api/reimbursements/:id/reject` | `ADMIN`, `TREASURER` | Reject reimbursement payout (Separation of duties: rejects self-review) | Param: `id`, Body: `reason` | `200`, `400`, `403` (`SELF_REVIEW_FORBIDDEN`), `404` |

### E.13 Treasury Ledger & Financial Analytics
| Method & Path | Auth & Roles | Purpose | Key Inputs | Responses |
|---|---|---|---|---|
| `GET /api/finance/summary` | `ADMIN`, `TREASURER` | Unified organization financial statement | None | `200`, `403` |
| `GET /api/finance/ledger` | `ADMIN`, `TREASURER` | Chronological multi-stream transaction ledger | Query: `category`, `startDate`, `endDate`, `page`, `limit` | `200`, `403` |
| `GET /api/finance/export` | `ADMIN`, `TREASURER` | Stream reconciled ledger in RFC 4180 CSV format (OWASP sanitized) | None | `200` (text/csv), `403` |

---

# Section F — Representative Request & Response Payloads

### F.1 Event Registration Reservation & Free Ticket
- **Request:** `POST /api/events/3a985bf2-60ea-4fc0-a541-69f6880860d5/registrations`
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration confirmed",
    "data": {
      "registration": {
        "id": "e4b2d1c9-77e8-469b-b5d1-9231f6d3f28a",
        "eventId": "3a985bf2-60ea-4fc0-a541-69f6880860d5",
        "userId": "c1f7a4e2-892b-4c07-9b21-4f7f6b98e1a1",
        "status": "CONFIRMED",
        "tier": "STANDARD",
        "amountPaise": 0,
        "currency": "INR",
        "cancelledAt": null,
        "createdAt": "2026-10-04T00:30:00.000Z",
        "updatedAt": "2026-10-04T00:30:00.000Z"
      },
      "ticket": {
        "id": "t8c2a1e3-4f90-410a-81a1-7789d20c5b33",
        "status": "ISSUED",
        "qrToken": "cf_sec_019238475892348572390485",
        "qrDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "issuedAt": "2026-10-04T00:30:00.000Z"
      },
      "payment": null
    }
  }
  ```

### F.2 Paid Event Payment Verification & Ticket Issuance
- **Request:** `POST /api/payments/verify`
  ```json
  {
    "razorpay_order_id": "order_Kj98a7sdfyU891",
    "razorpay_payment_id": "pay_Kj98b9sduf9823",
    "razorpay_signature": "4a713998b5849887754b29bb882944b1c28c8948192847589218294719283748"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment verified",
    "data": {
      "payment": {
        "id": "p8912347-1234-4567-8901-123456789012",
        "razorpayOrderId": "order_Kj98a7sdfyU891",
        "razorpayPaymentId": "pay_Kj98b9sduf9823",
        "amountPaise": 25000,
        "currency": "INR",
        "status": "PAID"
      },
      "ticket": {
        "id": "t1234567-89ab-cdef-0123-456789abcdef",
        "status": "ISSUED",
        "qrAvailable": true,
        "issuedAt": "2026-10-04T00:35:00.000Z"
      },
      "alreadyVerified": false
    }
  }
  ```

### F.3 QR Attendance Check-In Execution
- **Request:** `POST /api/events/3a985bf2-60ea-4fc0-a541-69f6880860d5/check-in`
  ```json
  {
    "token": "cf_sec_019238475892348572390485"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Attendee checked in",
    "data": {
      "result": "CHECKED_IN",
      "checkedInAt": "2026-10-04T00:40:00.000Z",
      "attendee": {
        "id": "c1f7a4e2-892b-4c07-9b21-4f7f6b98e1a1",
        "name": "Ada Lovelace",
        "email": "ada@campus.edu"
      },
      "ticket": {
        "id": "t8c2a1e3-4f90-410a-81a1-7789d20c5b33",
        "status": "USED",
        "tier": "STANDARD"
      }
    }
  }
  ```

### F.4 Expense Approval (Auto-Queues Reimbursement Claim)
- **Request:** `POST /api/expenses/7b981245-c89e-450a-9d22-124976a12b3c/approve`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Expense approved and reimbursement claim queued successfully",
    "data": {
      "id": "7b981245-c89e-450a-9d22-124976a12b3c",
      "title": "Robotics Sensor Kit & Soldering Wire",
      "amount": 3450,
      "currency": "INR",
      "category": "EQUIPMENT",
      "status": "APPROVED",
      "reviewerId": "a9012345-6789-abcd-ef01-234567890abc",
      "reviewedAt": "2026-10-04T00:45:00.000Z",
      "reimbursement": {
        "id": "r1234567-89ab-cdef-0123-456789abcdef",
        "expenseId": "7b981245-c89e-450a-9d22-124976a12b3c",
        "claimantId": "c1f7a4e2-892b-4c07-9b21-4f7f6b98e1a1",
        "amount": 3450,
        "currency": "INR",
        "status": "PENDING",
        "settledAt": null,
        "settlementReference": null
      }
    }
  }
  ```

### F.5 Treasury Financial Statement
- **Request:** `GET /api/finance/summary`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Finance summary retrieved successfully",
    "data": {
      "currency": "INR",
      "totalApprovedExpenses": 14250,
      "totalPendingExpenses": 3200,
      "totalRejectedExpenses": 1800,
      "totalSettledReimbursements": 10800,
      "outstandingReimbursementObligations": 3450,
      "totalVerifiedFundraiserContributions": 85000,
      "totalTicketRevenue": 42500,
      "totalMerchRevenue": 19500,
      "totalInflows": 147000,
      "totalOutflows": 10800,
      "netTreasuryBalance": 136200,
      "expensesByCategory": [
        { "category": "EQUIPMENT", "amount": 7500, "count": 2 },
        { "category": "SUPPLIES", "amount": 4250, "count": 3 },
        { "category": "REFRESHMENTS", "amount": 2500, "count": 1 }
      ],
      "contributionsByFundraiser": [
        {
          "fundraiserId": "f1234567-89ab-cdef-0123-456789abcdef",
          "fundraiserTitle": "Annual Solar Car Initiative",
          "amount": 85000,
          "count": 12
        }
      ]
    }
  }
  ```

---

# Section G — Role-Permission Matrix

The CampusFlow RBAC engine strictly validates permissions at the router layer via `requirePermission` / `requireRole` and verifies resource ownership at the service layer:

| Resource & Operation | `ADMIN` | `EVENT_MANAGER` | `TREASURER` | `MEMBER` | Public / Unauth |
|---|:---:|:---:|:---:|:---:|:---:|
| **Read Own Profile / Update Name** | Allowed | Allowed | Allowed | Allowed | Denied (401) |
| **List Users / Manage Roles** | Allowed | Denied (403) | Denied (403) | Denied (403) | Denied (401) |
| **Apply / Renew Membership** | Allowed | Allowed | Allowed | Allowed | Denied (401) |
| **Manage Membership Statuses** | Allowed | Denied (403) | Denied (403) | Denied (403) | Denied (401) |
| **View All Memberships** | Allowed | Denied (403) | Allowed | Denied (403) | Denied (401) |
| **Browse Published Events** | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Create / Update Events** | Allowed | Allowed | Denied (403) | Denied (403) | Denied (401) |
| **Publish / Cancel Events** | Allowed | Conditional (Organizer) | Denied (403) | Denied (403) | Denied (401) |
| **Register for Event (Free/Paid)** | Allowed | Allowed | Allowed | Allowed | Denied (401) |
| **Access Event Roster** | Allowed | Conditional (Organizer) | Denied (403) | Denied (403) | Denied (401) |
| **Inspect / Validate Ticket** | Allowed | Conditional (Organizer) | Denied (403) | Denied (403) | Denied (401) |
| **Check In Ticket Attendee** | Allowed | Conditional (Organizer) | Denied (403) | Denied (403) | Denied (401) |
| **Create Merchandise Product** | Allowed | Denied (403) | Denied (403) | Denied (403) | Denied (401) |
| **Adjust Variant Inventory** | Allowed | Denied (403) | Denied (403) | Denied (403) | Denied (401) |
| **Place Merchandise Order** | Allowed | Allowed | Allowed | Allowed | Denied (401) |
| **View All Merchandise Orders** | Allowed | Denied (403) | Allowed | Denied (403) | Denied (401) |
| **Create Announcement Draft** | Allowed | Allowed | Denied (403) | Denied (403) | Denied (401) |
| **Publish / Unpublish Announcement**| Allowed | Denied (403) | Denied (403) | Denied (403) | Denied (401) |
| **Create Volunteer Opportunity** | Allowed | Allowed | Denied (403) | Denied (403) | Denied (401) |
| **Volunteer Sign-Up / Cancel** | Allowed | Allowed | Allowed | Allowed | Denied (401) |
| **View Volunteer Participant Roster**| Allowed | Allowed | Denied (403) | Denied (403) | Denied (401) |
| **Record Volunteer Attendance** | Allowed | Allowed | Denied (403) | Denied (403) | Denied (401) |
| **Create / Publish Fundraiser** | Allowed | Allowed | Allowed | Denied (403) | Denied (401) |
| **Donate to Fundraiser (Cash/Online)**| Allowed | Allowed | Allowed | Allowed | Allowed |
| **Submit Expense Claim** | Allowed | Allowed | Allowed | Allowed | Denied (401) |
| **Approve / Reject Expense** | Allowed | Denied (403) | Allowed | Denied (403) | Denied (401) |
| **Approve Own Expense (Self-Approval)**| **DENIED (403)** | **DENIED (403)** | **DENIED (403)**| **DENIED (403)** | Denied (401) |
| **Settle Reimbursement Payout** | Allowed | Denied (403) | Allowed | Denied (403) | Denied (401) |
| **Settle Own Reimbursement (Self-Settlement)**| **DENIED (403)** | **DENIED (403)** | **DENIED (403)**| **DENIED (403)** | Denied (401) |
| **View Treasury Dashboard & Ledger**| Allowed | Denied (403) | Allowed | Denied (403) | Denied (401) |
| **Export General Ledger to CSV** | Allowed | Denied (403) | Allowed | Denied (403) | Denied (401) |

---

# Section H — Database Architecture & Prisma Schema Reference

## H.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ RefreshToken : "owns"
    User ||--o{ Membership : "holds"
    User ||--o{ Event : "organizes"
    User ||--o{ EventRegistration : "registers"
    User ||--o{ Ticket : "holds"
    User ||--o{ Payment : "submits"
    User ||--o{ CheckIn : "performs"
    User ||--o{ MerchOrder : "places"
    User ||--o{ Announcement : "authors"
    User ||--o{ VolunteerOpportunity : "organizes"
    User ||--o{ VolunteerRegistration : "signs up"
    User ||--o{ Fundraiser : "creates"
    User ||--o{ FundraiserContribution : "donates"
    User ||--o{ Expense : "submits"
    User ||--o{ Reimbursement : "claims"

    Event ||--o{ EventRegistration : "records"
    Event ||--o{ Ticket : "issues"
    Event ||--o{ Payment : "receives"
    Event ||--o{ CheckIn : "audits"
    Event ||--o{ VolunteerOpportunity : "hosts"
    Event ||--o{ Expense : "incurs"

    EventRegistration ||--o| Ticket : "yields"
    EventRegistration ||--o{ Payment : "paid via"

    Ticket ||--o| CheckIn : "redeemed by"

    Product ||--o{ ProductVariant : "has sizes"
    Product ||--o{ MerchOrderItem : "ordered in"
    MerchOrder ||--o{ MerchOrderItem : "contains"

    VolunteerOpportunity ||--o{ VolunteerRegistration : "rosters"

    Fundraiser ||--o{ FundraiserContribution : "collects"
    Fundraiser ||--o{ Expense : "funds"

    Expense ||--o| Reimbursement : "spawns on approval"
```

## H.2 Complete Model & Table Reference

### 1. `users` (`User`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `email` (String, unique, indexed), `name` (String), `passwordHash` (String), `role` (`ADMIN`, `MEMBER`, `EVENT_MANAGER`, `TREASURER`, default `MEMBER`), `status` (`active`, `disabled`, default `active`), `tokenVersion` (Int, default 0), `createdAt`, `updatedAt`.
- **Security Rules:** `passwordHash` and `tokenVersion` are stripped by `toPublicUser` and are never exposed over the API.

### 2. `refresh_tokens` (`RefreshToken`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `userId` (FK to `users.id`, Cascade Delete), `tokenHash` (String, unique, indexed), `familyId` (UUID string, indexed), `expiresAt` (DateTime), `revokedAt` (DateTime?, nullable), `replacedById` (String?, nullable), `createdAt`.
- **Integrity:** SHA-256 hashed. Rotation invalidates old token and links `replacedById`.

### 3. `memberships` (`Membership`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `userId` (FK to `users.id`), `memberCode` (String, unique, format `CF-YYYY-XXXX`), `planName` (String), `status` (`PENDING`, `ACTIVE`, `EXPIRED`, `SUSPENDED`, `REJECTED`), `startDate`, `validUntil`, `renewalCount` (Int), `perks` (String array), `adminNotes` (String?, nullable).

### 4. `events` (`Event`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `title`, `description`, `venue`, `category?`, `imageUrl?`, `startsAt`, `endsAt`, `status` (`DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`), `memberPrice` (Int, Rupees), `standardPrice` (Int, Rupees), `totalCapacity` (Int?, nullable = unlimited), `registeredCount` (Int), `isFeatured` (Boolean), `organizerId` (FK to `users.id`).

### 5. `event_registrations` (`EventRegistration`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `eventId` (FK to `events.id`), `userId` (FK to `users.id`), `status` (`PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED`), `tier` (`MEMBER`, `STANDARD`), `amountPaise` (Int, Authoritative), `currency` (`INR`), `cancelledAt`.
- **Constraint:** Partial unique index guarantees a user has at most one active (`PENDING_PAYMENT` or `CONFIRMED`) registration per event.

### 6. `payments` (`Payment`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `registrationId` (FK to `event_registrations.id`), `eventId`, `userId`, `razorpayOrderId` (unique, nullable), `razorpayPaymentId` (unique, nullable), `amountPaise` (Int), `currency` (`INR`), `status` (`CREATED`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`), `signatureVerifiedAt`, `failureReason`.

### 7. `tickets` (`Ticket`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `registrationId` (unique FK), `eventId`, `userId`, `status` (`ISSUED`, `USED`, `CANCELLED`), `verificationTokenHash` (String, unique), `encryptedVerificationToken` (String, AES-GCM ciphertext), `issuedAt`, `checkedInAt`, `checkedInById`.

### 8. `check_ins` (`CheckIn`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `ticketId` (String, unique), `eventId`, `staffUserId`, `checkedInAt`.

### 9. `products` & `product_variants`
- **Product:** `id`, `name`, `description`, `imageUrl?`, `category`, `sku?`, `memberPrice`, `standardPrice`, `status` (`ACTIVE`, `INACTIVE`).
- **ProductVariant:** `id`, `productId` (FK), `size` (String), `stock` (Int). Unique on `[productId, size]`.

### 10. `merch_orders` & `merch_order_items`
- **MerchOrder:** `id`, `orderNumber` (unique), `userId`, `status` (`PLACED`, `CANCELLED`), `totalAmount` (Rupees), `idempotencyKey` (unique), `cancelledAt`.
- **MerchOrderItem:** `id`, `orderId` (FK), `productId`, `size`, `productName`, `unitPrice`, `quantity`, `lineTotal`.

### 11. `announcements` (`Announcement`)
- **Primary Key:** `id` (UUIDv4)
- **Fields:** `title`, `body`, `authorId`, `status` (`DRAFT`, `PUBLISHED`), `audience` (`ALL_MEMBERS`, `VOLUNTEERS`, `EVENT_ATTENDEES`), `publishedAt`.

### 12. `volunteer_opportunities` & `volunteer_registrations`
- **VolunteerOpportunity:** `id`, `title`, `description`, `location`, `startsAt`, `endsAt`, `applicationDeadline?`, `capacity`, `registeredCount`, `status` (`DRAFT`, `PUBLISHED`, `CLOSED`, `CANCELLED`), `category?`, `eligibility?`, `eventId?`, `organizerId`.
- **VolunteerRegistration:** `id`, `opportunityId`, `userId`, `status` (`REGISTERED`, `ATTENDED`, `CANCELLED`, `NO_SHOW`), `notes?`, `attendanceNotes?`, `attendedAt?`, `attendedById?`, `cancelledAt?`. Unique constraint on `@@unique([opportunityId, userId])`.

### 13. `fundraisers` & `fundraiser_contributions`
- **Fundraiser:** `id`, `title`, `description`, `purpose?`, `goalAmount`, `currency`, `status` (`DRAFT`, `ACTIVE`, `CLOSED`, `CANCELLED`), `startsAt?`, `deadline?`, `beneficiary?`, `creatorId`.
- **FundraiserContribution:** `id`, `fundraiserId`, `donorId?`, `donorName`, `donorEmail`, `amount`, `currency`, `paymentMethod` (`ONLINE`, `CASH`, `DIRECT`), `status` (`PENDING`, `VERIFIED`, `FAILED`, `REFUNDED`), `razorpayOrderId?`, `razorpayPaymentId?`, `verifiedAt?`, `idempotencyKey?`.

### 14. `expenses` & `reimbursements`
- **Expense:** `id`, `title`, `description`, `amount`, `currency`, `category` (`SUPPLIES`, `TRAVEL`, `VENUE`, `REFRESHMENTS`, `EQUIPMENT`, `MARKETING`, `OTHER`), `expenseDate`, `receiptUrl?`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `submitterId`, `reviewerId?`, `reviewedAt?`, `rejectionReason?`, `eventId?`, `fundraiserId?`.
- **Reimbursement:** `id`, `expenseId` (unique FK to `expenses.id`), `claimantId`, `amount`, `currency`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `SETTLED`), `reviewerId?`, `reviewedAt?`, `rejectionReason?`, `settledById?`, `settledAt?`, `settlementReference?`, `notes?`.

---

# Section I — End-to-End Business Workflows

### 1. User Authentication & Session Rotation
1. Client submits `POST /api/auth/login` with email and password.
2. Server validates credentials with bcrypt and returns `{ token, refreshToken, expiresIn, user }`.
3. Client stores `token` in memory and persists `refreshToken`.
4. On protected calls, client attaches `Authorization: Bearer <token>`.
5. When API returns `401 TOKEN_EXPIRED`, client calls `POST /api/auth/refresh` with `{ refreshToken }`.
6. Server validates and rotates refresh token, returning a new token pair.
7. Upon sign-out, client calls `POST /api/auth/logout`, invalidating all active sessions.

### 2. Paid Event Registration & Ticket Issuance
1. Member calls `POST /api/events/:eventId/registrations`.
2. Server determines tier price based on whether caller holds an active membership.
3. If free (`amountPaise === 0`), status becomes `CONFIRMED` and Ticket is generated immediately.
4. If paid (`amountPaise > 0`), registration is saved in `PENDING_PAYMENT`.
5. Client calls `POST /api/registrations/:registrationId/payment-order` to generate a Razorpay order.
6. Client launches Razorpay checkout popup.
7. Upon successful payment on frontend, client sends `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` to `POST /api/payments/verify`.
8. Backend verifies HMAC-SHA256 signature against `RAZORPAY_KEY_SECRET`. Upon confirmation, registration transitions to `CONFIRMED` and Ticket is issued.

### 3. QR Event Check-In
1. Attendee opens digital pass (`GET /api/tickets/:ticketId/qr`).
2. Event door staff scans the QR code containing token string `cf_sec_...`.
3. Scanner client calls `POST /api/events/:eventId/check-in` with `{ "token": "cf_sec_..." }`.
4. Backend verifies caller is event organizer or `ADMIN`.
5. Backend hashes token, checks ticket status (`ISSUED`), checks event date/status, updates ticket to `USED`, and writes a `check_ins` record.
6. Second scan attempt returns `409 ALREADY_CHECKED_IN`.

### 4. Expense Submission, Multi-Role Approval & Reimbursement Settlement
1. Student member incurs club expenses and submits claim via `POST /api/expenses`.
2. Claim status is set to `PENDING`.
3. Treasurer or Admin views queue (`GET /api/expenses?status=PENDING`).
4. Reviewer calls `POST /api/expenses/:id/approve`.
   - **Enforced Rule:** Submitter cannot approve their own claim (`403 SELF_APPROVAL_FORBIDDEN`).
   - Expense status transitions to `APPROVED`.
   - Linked `Reimbursement` record is automatically created in `PENDING` state.
5. Treasurer executes bank disbursement (NEFT/UPI) and records payment reference via `POST /api/reimbursements/:id/settle`.
   - **Enforced Rule:** Claimant cannot settle their own payout (`403 SELF_SETTLEMENT_FORBIDDEN`).
   - Reimbursement status transitions to `SETTLED`.

---

# Section J — Error Handling & Validation Standards

## J.1 Standard Error Codes
All error responses adhere to the standard envelope `{ "success": false, "error": { "code", "message", "details" } }`:

| Code | HTTP Status | Trigger Condition |
|---|:---:|---|
| `BAD_REQUEST` | 400 | Malformed JSON or invalid syntax |
| `UNAUTHORIZED` | 401 | Missing, malformed, or invalid bearer token |
| `TOKEN_EXPIRED` | 401 | Access token expired (trigger refresh flow) |
| `TOKEN_REVOKED` | 401 | Access token was invalidated by logout or role demotion |
| `INVALID_CREDENTIALS`| 401 | Email/password mismatch or disabled account |
| `INVALID_REFRESH_TOKEN`| 401 | Expired, unknown, or replayed refresh token |
| `FORBIDDEN` | 403 | Insufficient RBAC permission |
| `ACCOUNT_DISABLED` | 403 | Account marked disabled by admin |
| `SELF_APPROVAL_FORBIDDEN` | 403 | Submitter attempting to approve own expense |
| `SELF_SETTLEMENT_FORBIDDEN` | 403 | Claimant attempting to settle own reimbursement |
| `SELF_REVIEW_FORBIDDEN` | 403 | Claimant attempting to review own reimbursement |
| `NOT_FOUND` | 404 | Endpoint or targeted database record not found |
| `CONFLICT` | 409 | Duplicate unique key (email, member code, registration) |
| `ALREADY_REGISTERED`| 409 | User already has active event registration |
| `CAPACITY_REACHED` | 409 | Event or volunteer shift capacity full |
| `ALREADY_CHECKED_IN`| 409 | Ticket has already been scanned and redeemed |
| `VALIDATION_ERROR` | 422 | Zod schema validation failure on request payload |
| `RATE_LIMITED` | 429 | Exceeded IP rate limit threshold |
| `INTERNAL_SERVER_ERROR`| 500 | Unhandled server error (sanitized message returned) |
| `SERVICE_UNAVAILABLE`| 503 | Database or Razorpay connection offline |

---

# Section K — Frontend Developer API Handoff

## K.1 API Client Implementation Guidelines
1. **Base URL:** Configure `VITE_API_URL` pointing to backend origin + `/api` (e.g. `http://localhost:5000/api`).
2. **Authorization Header:** For all authenticated calls, pass:
   ```http
   Authorization: Bearer <token>
   ```
3. **Response Unwrapping:** Success responses always enclose data in the `data` property. Always check `response.data.success === true` before parsing `response.data.data`.
4. **Dates & Timestamps:** All dates are returned in ISO 8601 UTC format (`YYYY-MM-DDTHH:mm:ss.sssZ`). Form inputs must submit ISO strings.
5. **Monetary Units:**
   - Ticket prices on events: whole INR Rupees.
   - Payment order amounts: integer **paise** (`amountPaise = rupees * 100`).
   - Merchandise & Fundraisers: whole INR Rupees.
6. **Form Validation Alignment:** All form fields should mirror Zod schemas documented in `backend/src/validators/`.

## K.2 Screen-to-API Mapping

| Frontend Screen | Route Path | APIs Used |
|---|---|---|
| **Login / Register** | `/login`, `/register` | `POST /api/auth/login`, `POST /api/auth/register` |
| **Member Profile** | `/profile` | `GET /api/auth/me`, `PATCH /api/auth/me` |
| **Membership Dashboard** | `/membership` | `GET /api/memberships/me`, `POST /api/memberships/apply`, `POST /api/memberships/:id/renew` |
| **Event Catalogue** | `/events` | `GET /api/events` |
| **Event Details & Checkout**| `/events/:id` | `GET /api/events/:id`, `POST /api/events/:id/registrations`, `POST /api/registrations/:id/payment-order`, `POST /api/payments/verify` |
| **My Tickets & QR Pass** | `/tickets` | `GET /api/tickets/me`, `GET /api/tickets/:id/qr` |
| **Staff Ticket Scanner** | `/admin/checkin` | `POST /api/events/:id/tickets/validate`, `POST /api/events/:id/check-in` |
| **Merchandise Store** | `/store` | `GET /api/products`, `GET /api/products/:id`, `POST /api/orders` |
| **My Store Orders** | `/orders` | `GET /api/orders/me`, `POST /api/orders/:id/cancel` |
| **Volunteer Opportunities** | `/volunteers` | `GET /api/volunteers/opportunities`, `GET /api/volunteers/opportunities/:id`, `POST /api/volunteers/opportunities/:id/signups` |
| **My Volunteering Shifts** | `/member/volunteering` | `GET /api/volunteers/signups/me`, `POST /api/volunteers/signups/:id/cancel` |
| **Coordinator Volunteer Desk**| `/admin/volunteers` | `GET /api/volunteers/opportunities/:id/participants`, `PATCH /api/volunteers/signups/:id/attendance` |
| **Fundraiser Campaigns** | `/fundraisers` | `GET /api/fundraisers`, `GET /api/fundraisers/:id`, `POST /api/fundraisers/:id/contributions`, `POST /api/fundraisers/verify` |
| **Submit Expense Claim** | `/member/expenses` | `POST /api/expenses`, `GET /api/expenses/me` |
| **Treasury Dashboard** | `/admin/treasury` | `GET /api/finance/summary`, `GET /api/finance/ledger`, `GET /api/finance/export`, `GET /api/expenses`, `POST /api/expenses/:id/approve`, `POST /api/expenses/:id/reject`, `POST /api/reimbursements/:id/settle` |
| **Admin User Management** | `/admin/users` | `GET /api/admin/users`, `PATCH /api/admin/users/:id/role` |

---

# Section L — Security & Integration Notes

1. **Server-Side Authoritative Computations:** The backend never trusts client-supplied amounts, fees, totals, or statuses. Amounts are derived directly from the database catalog.
2. **Cryptographic Integrity:**
   - Webhooks are verified using raw binary buffers via HMAC SHA-256 (`RAZORPAY_WEBHOOK_SECRET`).
   - QR tokens are encrypted using AES-256-GCM. The raw token is stored only as a cryptographic hash in the database.
3. **Database Concurrency Protection:**
   - Event and volunteer slot reservations use atomic conditional decrement queries (`updateMany ... WHERE registeredCount < capacity`) inside transactions.
   - Variant stock updates use optimistic locking with expected stock verification.
4. **OWASP Protections:**
   - CSV export sanitization blocks spreadsheet formula injection by prefixing `=, +, -, @, \t, \r` with single quotes.
   - Helmet enforces strict HTTP security headers.
   - Rate limiting protects authentication routes against brute-force attacks.

---

# Section M — Verification Results Matrix

| Requirement / Module | Verification Status | Evidence | Remaining Work |
|---|:---:|---|---|
| **System & Health Checks** | `PASS — Verified` | 12 tests passing in `tests/health.test.ts`. Active probe verified on Neon PostgreSQL. | None |
| **Authentication & Tokens** | `PASS — Verified` | 20 tests passing in `tests/auth.test.ts`. Token rotation, family revocation, and lockout verified. | None |
| **Four-Role RBAC System** | `PASS — Verified` | 9 tests passing in `tests/rbac.test.ts`. Route middleware and admin protection verified. | None |
| **Memberships Management** | `PASS — Verified` | 15 tests passing in `tests/memberships.test.ts`. Code collision retry, plans, and lifecycle verified. | None |
| **Events & Scheduling** | `PASS — Verified` | 13 tests passing in `tests/events.test.ts`. Draft/publish visibility and role gating verified. | None |
| **Registrations & Capacities**| `PASS — Verified` | 15 tests passing in `tests/registrations.test.ts`. Duplicate checks and pricing tier logic verified. | None |
| **Tickets & QR Cryptography** | `PASS — Verified` | 6 tests passing in `tests/checkin.test.ts`. AES-GCM encryption, decryption, and duplicate check-in verified. | None |
| **Razorpay Payments & Webhook**| `PASS — Verified` | 24 tests passing in `tests/payments.test.ts`. Signature checks, provider errors, and idempotency verified. | None |
| **Merchandise & Stock Locking**| `PASS — Verified` | 20 tests passing in `tests/phase4.test.ts`. Concurrency rollback and stock preservation verified. | None |
| **Volunteer Management** | `PASS — Verified` | Tested in `tests/phase5.test.ts`. Concurrency capacity checks and coordinator attendance verified. | None |
| **Fundraisers & Donations** | `PASS — Verified` | Tested in `tests/phase5.test.ts`. Verified-only aggregates and idempotency verified. | None |
| **Expenses & Reimbursements**| `PASS — Verified` | Tested in `tests/phase5.test.ts`. Separation of duties (self-approval/self-settlement blocked) verified. | None |
| **Treasury Reports & CSV** | `PASS — Verified` | Tested in `tests/phase5.test.ts`. Double-entry reconciliations and OWASP formula sanitization verified. | None |
| **Database Migrations** | `PASS — Verified` | 7 migrations deployed to Neon PostgreSQL. `prisma migrate status` clean. | None |
| **TypeScript Typecheck** | `PASS — Verified` | `tsc --noEmit` exits with code 0 across all files. | None |
| **ESLint Compliance** | `PASS — Verified` | `eslint` exits with code 0 across all files. | None |

---

# Section N — Final Handoff & Readiness Assessment

1. **Total Registered Routes:** 99 active, verified endpoints across 14 route controllers.
2. **Missing Endpoints:** 0. All capabilities required by the product context and roadmap are fully implemented and verified.
3. **Frontend Scope Adherence:** Zero files inside `frontend/` were modified, created, or deleted during this task.
4. **Backend Readiness Rating:** **100% PRODUCTION READY FOR INDEPENDENT FRONTEND DEVELOPMENT**.
5. **Recommended Next Step for Frontend Engineer:** Review Section K (Screen-to-API Mapping) and Section F (JSON Payloads) to construct the API client services and UI views.
