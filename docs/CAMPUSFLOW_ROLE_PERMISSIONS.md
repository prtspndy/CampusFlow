# CampusFlow — Canonical Four-Role RBAC & Permissions Reference

> **Audience**: B.Tech Students, Faculty Evaluators, and Technical Interviewers  
> **Source Files**: 
> - [backend/src/types/auth.ts](file:///D:/Projects/CampusFlow/backend/src/types/auth.ts)
> - [backend/src/middleware/authorize.middleware.ts](file:///D:/Projects/CampusFlow/backend/src/middleware/authorize.middleware.ts)
> - [frontend/src/lib/permissions.ts](file:///D:/Projects/CampusFlow/frontend/src/lib/permissions.ts)
> - [frontend/src/lib/constants.ts](file:///D:/Projects/CampusFlow/frontend/src/lib/constants.ts)

---

## Table of Contents
1. [Core Security Concepts: The Theory Every Student Must Know](#1-core-security-concepts-the-theory-every-student-must-know)
2. [The Canonical Four Roles Overview](#2-the-canonical-four-roles-overview)
3. [Deep Dive: Role by Role Specification](#3-deep-dive-role-by-role-specification)
   - [3.1 ADMIN (Admin / Organization President)](#31-admin-admin--organization-president)
   - [3.2 EVENT_MANAGER (Event Manager / Volunteer)](#32-event_manager-event-manager--volunteer)
   - [3.3 TREASURER (Treasurer)](#33-treasurer-treasurer)
   - [3.4 MEMBER (Club Member / Student)](#34-member-club-member--student)
4. [Master Role Comparison Table](#4-master-role-comparison-table)
5. [The Permission System Mechanics](#5-the-permission-system-mechanics)
6. [Concrete Security Trace: A Member Attempting Privilege Escalation](#6-concrete-security-trace-a-member-attempting-privilege-escalation)
7. [Guardrails, Safeguards & Session Invalidation](#7-guardrails-safeguards--session-invalidation)

---

## 1. Core Security Concepts: The Theory Every Student Must Know

Before explaining code details, you must understand four fundamental security distinctions that interviewers frequently ask:

```mermaid
graph TD
    subgraph Layer1 ["1. Authentication (Who are you?)"]
        Login["Email + Password submitted"] --> Token["JWT Access Token Issued"]
    end

    subgraph Layer2 ["2. Authorization (What are you allowed to do?)"]
        Role["Role: ADMIN, MEMBER, etc."] --> Permissions["Permissions Matrix (e.g. users.assign_roles)"]
    end

    subgraph Layer3 ["3. Enforcement (Where is it checked?)"]
        FrontendGuard["Frontend: RequireAuth (Hides/Shows UI, cosmetic)"]
        BackendGuard["Backend: authorize.middleware (Returns 401/403, actual security)"]
    end

    Layer1 --> Layer2 --> Layer3
```

### A. Authentication vs Authorization
- **Authentication (AuthN)**: Answering the question: *"Who are you?"*  
  In CampusFlow, authentication happens when a user submits their email and password at `POST /api/auth/login`. If the password matches the stored bcrypt hash, the server issues a signed JWT access token.
- **Authorization (AuthZ)**: Answering the question: *"Are you permitted to perform this specific action?"*  
  Even after an authenticated user proves they are `Ada Student`, authorization verifies whether `Ada Student` has the `events.create` permission before allowing them to post a new campus hackathon.

### B. Role vs Permission
- **Role**: A high-level title or job designation assigned to a person (e.g. `ADMIN`, `EVENT_MANAGER`, `TREASURER`, `MEMBER`).
- **Permission**: A granular, atomic capability token formatted in dot notation (e.g. `events.create`, `users.assign_roles`, `finance.read`).
- **Why Both?**: In CampusFlow, code does not hardcode business rules directly to roles. Instead, **roles map to sets of permissions**. If the club decides next semester that Event Managers should also view member phone numbers, we update the permissions matrix in one central location without rewriting dozens of routes.

### C. Frontend Route Guards vs Backend Authorization
- **Frontend Route Guard (`RequireAuth`)**: Runs inside the user's browser. It checks `user.role` or `hasPermission(user, '...')` to decide whether to render a dashboard page or show an "Access Restricted" alert.  
  *Crucial Fact*: Frontend guards are purely for **User Experience (UX)**. An attacker can open Chrome DevTools, bypass JavaScript conditions, or use Postman to bypass frontend guards completely.
- **Backend Authorization Middleware (`requirePermission`)**: Runs on the Express server. It inspects the cryptographically signed JWT token on incoming HTTP requests. If the user lacks the required permission, the server rejects the request with HTTP 403 Forbidden before any database query executes.  
  *Crucial Fact*: **Backend authorization is the only real security barrier.**

### D. Hiding a Button vs Preventing an Unauthorized Request
Hiding a "Delete Event" button on a webpage stops accidental clicks, but does not stop an attacker from sending a `DELETE /api/events/123` HTTP request directly using `curl` or Postman. Proper security requires **defense-in-depth**: hide the button in the UI for good UX, but enforce the permission on the server route to guarantee security.

---

## 2. The Canonical Four Roles Overview

CampusFlow defines four canonical roles in the PostgreSQL database enum `UserRole` (`backend/prisma/schema.prisma`):

| Enum Key | Display Name | Intended User | Default Dashboard |
| :--- | :--- | :--- | :--- |
| `ADMIN` | Admin / Organization President | Club President, Faculty Coordinator | `/admin` (Executive Overview) |
| `EVENT_MANAGER` | Event Manager / Volunteer | Event Organizer, Stage Manager, Volunteer | `/admin` (Event Operations Console) |
| `TREASURER` | Treasurer | Financial Officer, Comptroller | `/admin` (Treasury Overview) |
| `MEMBER` | Club Member / Student | General College Student | `/member` (Student Member App) |

---

## 3. Deep Dive: Role by Role Specification

### 3.1 ADMIN (Admin / Organization President)

- **A. Purpose**: Full administrative stewardship of the student organization. Responsible for onboarding leaders, delegating roles, overseeing finance, and managing organizational configuration.
- **B. Permissions Assigned** (from `ROLE_PERMISSIONS.ADMIN` in [auth.ts](file:///D:/Projects/CampusFlow/backend/src/types/auth.ts)):
  - `profile.read_own`, `profile.update_own`, `organization.read`, `organization.update`
  - `users.read`, `users.manage`, `users.assign_roles`
  - `memberships.read`, `memberships.read_own`, `memberships.purchase`, `memberships.renew_own`, `memberships.manage`
  - `events.read`, `events.read_drafts`, `events.create`, `events.update`, `events.delete`, `events.manage_all`, `events.registrations.read`, `events.registrations.manage`
  - `tickets.read_own`, `tickets.validate`, `attendance.read`, `attendance.manage`
  - `announcements.read`, `announcements.create`, `announcements.publish`
  - `merchandise.read`, `merchandise.manage`, `orders.create`, `orders.read_own`, `orders.read_all`
  - `payments.read`, `finance.read`, `finance.expenses.manage`, `reimbursements.read`, `reimbursements.review`, `reports.finance.read`, `reports.finance.export`
  - `fundraisers.read`, `fundraisers.manage`
- **C. Accessible Frontend Pages**:
  - `/admin` (Executive Overview with all four organizational stat tiles and Manage Roles quick action)
  - `/admin/users` (User & Role Management Console)
  - `/admin/members` (Member Directory)
  - `/admin/events` (Events Console)
  - `/checkin/:eventId` (Door Check-in Scanner)
  - `/admin/announcements` (Bulletin Composer)
  - `/admin/shop` (Merchandise & Stock)
  - `/admin/fundraisers` (Tasks & Fundraisers)
  - `/admin/treasury` (Treasury & Finance)
  - `/member` (Can also view personal member pass)
- **D. Visible Sidebar Links**: All 9 sidebar items in `AdminSidebar.tsx` (Dashboard, Users & Roles, Members, Events, Check-in, Announcements, Shop, Tasks, Treasury).
- **E. Backend Endpoints Allowed**: Every endpoint across `/api/admin`, `/api/users`, `/api/events`, `/api/memberships`, and `/api/auth`.
- **F. Database Scope**: Read/write across all records in `users`, `refresh_tokens`, `memberships`, `events`.
- **G. Forbidden Operations**: An admin **cannot demote or change the role of the last active administrator** in the organization. The server rejects this with HTTP 400.
- **H. Restricted URL Behavior**: Has access to all URLs.
- **I. Unauthorized API Behavior**: If unauthenticated (no token), returns HTTP 401. Otherwise allowed on all protected routes.
- **J. Realistic Workflow**: The Club President logs in, opens `/admin/users`, searches for a volunteer who just joined the organizing committee, and promotes them from `MEMBER` to `EVENT_MANAGER`. The target user's existing sessions are immediately invalidated.

---

### 3.2 EVENT_MANAGER (Event Manager / Volunteer)

- **A. Purpose**: Planning, running, and auditing campus events, workshops, galas, and mixers, and running the door scanner at venue entrances.
- **B. Permissions Assigned** (from `ROLE_PERMISSIONS.EVENT_MANAGER`):
  - `profile.read_own`, `profile.update_own`, `organization.read`
  - `memberships.read_own`, `memberships.purchase`, `memberships.renew_own`
  - `events.read`, `events.read_drafts`, `events.create`, `events.update`, `events.delete`
  - `events.registrations.read`, `events.registrations.manage`
  - `tickets.read_own`, `tickets.validate`, `attendance.read`, `attendance.manage`
  - `announcements.read`, `announcements.create`
  - `merchandise.read`, `orders.create`, `orders.read_own`
  - `fundraisers.read`, `fundraisers.manage`
- **C. Accessible Frontend Pages**:
  - `/admin` (Event Operations Console: Gala RSVPs, Tickets Validated, Active Event Drafts, Volunteer Tasks)
  - `/admin/events` (Event schedules and draft creation)
  - `/checkin/:eventId` (High-contrast door check-in QR scanner)
  - `/admin/announcements` (Drafting event updates)
  - `/admin/fundraisers` (Volunteer task boards)
  - `/member` (Personal student profile)
- **D. Visible Sidebar Links**: Dashboard, Events & Tickets, Door Check-in, Announcements, Tasks & Fundraisers.
- **E. Backend Endpoints Allowed**:
  - `POST /api/events` (Create event)
  - `GET /api/events` (List events including drafts)
  - `GET /api/events/:id` (Inspect event details)
  - `PATCH /api/events/:id` (Update event)
  - `POST /api/events/:id/publish` (Publish event)
  - `POST /api/events/:id/cancel` (Cancel event)
  - `POST /api/memberships` / `/renew` (Own membership pass)
- **F. Database Scope**: Read/write on `events` (for events they organized or manage); read-only on public users; cannot inspect other users' tokens or financial tables.
- **G. Forbidden Operations**:
  - Cannot access `/api/admin/users` (forbidden from viewing full user directory or assigning roles).
  - Cannot access `/api/memberships` staff listing.
  - Cannot approve reimbursements or edit general ledger.
- **H. Restricted URL Behavior**: If an Event Manager manually types `/admin/users` in the browser, `RequireAuth` blocks access and displays the "Access Restricted" view ("You are signed in as Event Manager / Volunteer. Your account does not have sufficient permissions to view this section.").
- **I. Unauthorized API Behavior**: If an Event Manager sends `PATCH /api/admin/users/123/role`, `requirePermission('users.assign_roles')` halts execution and responds with:
  ```json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "You do not have permission to perform this action",
      "details": []
    }
  }
  ```
- **J. Realistic Workflow**: The Event Manager opens `/admin/events`, creates a draft for "Hackathon 2026", sets capacity to 150 participants, and publishes it. On event day, they open `/checkin/event-gala-1` and scan student QR codes at the registration desk.

---

### 3.3 TREASURER (Treasurer)

- **A. Purpose**: Managing club finances, tracking dues collections, approving student reimbursement claims, maintaining the general ledger, and monitoring merchandise income.
- **B. Permissions Assigned** (from `ROLE_PERMISSIONS.TREASURER`):
  - `profile.read_own`, `profile.update_own`, `organization.read`
  - `memberships.read`, `memberships.read_own`, `memberships.purchase`, `memberships.renew_own`
  - `events.read`, `tickets.read_own`, `announcements.read`, `merchandise.read`
  - `orders.create`, `orders.read_own`, `orders.read_all`
  - `payments.read`, `finance.read`, `finance.expenses.manage`
  - `reimbursements.read`, `reimbursements.review`
  - `reports.finance.read`, `reports.finance.export`
  - `fundraisers.read`, `fundraisers.manage`
- **C. Accessible Frontend Pages**:
  - `/admin` (Treasury Overview: Net Treasury Balance, Dues Collected, Pending Reimbursements, Merchandise Revenue)
  - `/admin/members` (Auditing membership fee rosters and pass statuses)
  - `/admin/shop` (Reviewing merchandise order receipts)
  - `/admin/treasury` (General ledger, reimbursement approvals, financial exports)
  - `/admin/fundraisers` (Campaign revenue tracking)
  - `/member` (Personal student profile)
- **D. Visible Sidebar Links**: Dashboard, Members, Shop & Stock, Tasks & Fundraisers, Treasury & Finance.
- **E. Backend Endpoints Allowed**:
  - `GET /api/memberships` (Staff roster access to audit dues)
  - `GET /api/memberships/:id` (Inspect individual membership payment details)
  - `GET /api/events` (Published event list)
  - `GET /api/auth/me`, `PATCH /api/auth/me`
- **F. Database Scope**: Read access to all `memberships` records; read access to user names/emails attached to memberships; future read/write access to financial tables.
- **G. Forbidden Operations**:
  - Cannot access `/admin/users` or assign roles.
  - Cannot create, publish, or cancel events (`events.create` is forbidden).
  - Cannot run door check-in scanner (`tickets.validate` is forbidden).
- **H. Restricted URL Behavior**: Navigating to `/admin/users` or `/checkin/event-1` triggers the `RequireAuth` guard and renders the "Access Restricted" alert.
- **I. Unauthorized API Behavior**: Sending `POST /api/events` triggers `requirePermission('events:create')` and returns HTTP 403 Forbidden.
- **J. Realistic Workflow**: The Treasurer logs in, reviews the Treasury Dashboard, verifies ₹28,500 collected from 214 annual passes, inspects a ₹4,250 reimbursement submitted by a volunteer for hackathon snacks, approves the receipt, and exports the semester financial summary.

---

### 3.4 MEMBER (Club Member / Student)

- **A. Purpose**: Regular college student or club member participating in campus life, buying event tickets, showing their digital member pass, and ordering hoodies.
- **B. Permissions Assigned** (from `ROLE_PERMISSIONS.MEMBER`):
  - `profile.read_own`, `profile.update_own`, `organization.read`
  - `memberships.read_own`, `memberships.purchase`, `memberships.renew_own`
  - `events.read`, `tickets.read_own`, `announcements.read`
  - `merchandise.read`, `orders.create`, `orders.read_own`, `fundraisers.read`
- **C. Accessible Frontend Pages**:
  - `/` (Public Landing Page)
  - `/events`, `/events/:id` (Public event schedules)
  - `/shop`, `/shop/:id` (Merchandise store)
  - `/member` (Student Dashboard: active pass card, upcoming tickets, announcements)
  - `/member/pass` (Digital scannable QR Member Pass)
  - `/member/tickets` (Personal ticket wallet)
- **D. Visible Sidebar Links**: The admin sidebar is **completely hidden**. The member app features a phone-first bottom navigation bar (Home, Pass, Tickets).
- **E. Backend Endpoints Allowed**:
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
  - `GET /api/auth/me`, `PATCH /api/auth/me`
  - `GET /api/users/:userId` (Only allowed when `:userId` matches their own ID)
  - `POST /api/memberships` (Apply for membership pass)
  - `GET /api/memberships/me` (Retrieve own pass)
  - `POST /api/memberships/:id/renew` (Renew own pass)
  - `GET /api/events` (Published events only; drafts are hidden)
- **F. Database Scope**: Read/write strictly on their own user row, their own refresh tokens, and their own membership records.
- **G. Forbidden Operations**:
  - Cannot access any part of `/admin` (members, treasury, stock, announcements, users).
  - Cannot view draft events or cancel events.
  - Cannot validate tickets or run door scanner.
  - Cannot view other students' profiles or membership records.
- **H. Restricted URL Behavior**: If a student types `/admin` or `/admin/users` in the URL bar, `RequireAuth` intercepts the request:
  - Finds that `user.role === 'MEMBER'`, which is not in `ADMIN_CONSOLE_ROLES`.
  - Blocks the page and displays the "Access Restricted" alert with a button redirecting back to `/member`.
- **I. Unauthorized API Behavior**: Sending `GET /api/admin/users` triggers `requirePermission('users.read')` and immediately returns HTTP 403 Forbidden.
- **J. Realistic Workflow**: A freshman student signs up at `/join`, selects the Annual Gold Pass, logs into `/member`, shows their QR code pass at the club orientation table to claim a free sticker, and purchases a discounted gala ticket.

---

## 4. Master Role Comparison Table

| Capability / Resource | `ADMIN` | `EVENT_MANAGER` | `TREASURER` | `MEMBER` |
| :--- | :---: | :---: | :---: | :---: |
| **Open Admin Console (`/admin`)** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Blocked |
| **User & Role Management (`/admin/users`)** | ✅ Yes | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Assign Roles (`PATCH /api/admin/users/:id/role`)** | ✅ Yes | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **View All Users (`GET /api/admin/users`)** | ✅ Yes | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Create Events (`POST /api/events`)** | ✅ Yes | ✅ Yes | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **View Draft Events (`GET /api/events?status=DRAFT`)** | ✅ Yes | ✅ Yes | ❌ Filtered Out | ❌ Filtered Out |
| **Door Check-in Scanner (`/checkin/:id`)** | ✅ Yes | ✅ Yes | ❌ Blocked | ❌ Blocked |
| **Validate Tickets (`tickets.validate`)** | ✅ Yes | ✅ Yes | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **View All Memberships (`GET /api/memberships`)** | ✅ Yes | ❌ 403 Forbidden | ✅ Yes | ❌ 403 Forbidden |
| **Approve Membership Status (`PATCH /api/memberships/:id/status`)** | ✅ Yes | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Treasury Dashboard (`/admin/treasury`)** | ✅ Yes | ❌ Blocked | ✅ Yes | ❌ Blocked |
| **Review Reimbursements (`reimbursements.review`)** | ✅ Yes | ❌ 403 Forbidden | ✅ Yes | ❌ 403 Forbidden |
| **View Personal Member Pass (`/member/pass`)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Demote Last Administrator** | ❌ 400 Bad Request | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |

---

## 5. The Permission System Mechanics

### How Roles Are Converted into Permissions
In CampusFlow, permissions are not stored as separate rows in a relational database table. Instead, they are defined as a **declarative TypeScript matrix** in [backend/src/types/auth.ts](file:///D:/Projects/CampusFlow/backend/src/types/auth.ts):

```typescript
export const ROLE_PERMISSIONS = {
  MEMBER: [ ...13 permissions... ],
  EVENT_MANAGER: [ ...23 permissions... ],
  TREASURER: [ ...23 permissions... ],
  ADMIN: [ ...37 permissions... ],
} as const satisfies Record<UserRole, readonly string[]>;
```

### How the Frontend Receives Permissions
When a user signs in (`POST /api/auth/login`) or restores their session (`GET /api/auth/me`), the backend serializer [user.presenter.ts](file:///D:/Projects/CampusFlow/backend/src/services/user.presenter.ts) converts the database user record into a `PublicUser` DTO:

```typescript
export function toPublicUser(user: UserRecord): PublicUser {
  const role = normalizeRole(user.role);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    roleDisplayName: ROLE_DISPLAY_NAMES[role] ?? role,
    permissions: [...(ROLE_PERMISSIONS[role] ?? [])],
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
```

This means **the server is always authoritative**:
1. The client receives the user's role, human-readable display name, and full list of permissions in the JSON response payload.
2. The client caches this in Zustand (`authStore.ts`).
3. Client components call `hasPermission(user, 'events.create')` or `can(user, 'tickets.validate')` for UI rendering.
4. When the client makes an API call, the server re-evaluates the role independently using `authorize.middleware.ts`.

### Explanation of Authorization Helpers

| Helper | File Location | How It Works |
| :--- | :--- | :--- |
| `requirePermission(perm)` | `backend/src/middleware/authorize.middleware.ts` | Express middleware. Checks if `req.user.role` grants `perm`. If not, calls `next(new ForbiddenError())`. Supports legacy colon-separated aliases (e.g. `events:create` maps to `events.create`). |
| `requireAnyPermission(...perms)` | `backend/src/middleware/authorize.middleware.ts` | Express middleware. Passes if the user has **at least one** of the specified permissions. |
| `requireRole(...roles)` | `backend/src/middleware/authorize.middleware.ts` | Express middleware. Passes only if `req.user.role` matches one of the specified canonical roles. |
| `requireSelfOrAdmin(param)` | `backend/src/middleware/authorize.middleware.ts` | Express middleware. Verifies that `req.user.id === req.params[param]` OR the user has `users.read` permission. Prevents students from viewing each other's profiles. |
| `hasPermission(user, perm)` | `frontend/src/lib/permissions.ts` | Pure function. Checks if `user.permissions` includes `perm`. Falls back to `ROLE_PERMISSIONS[user.role]` if permissions array is missing. |
| `hasAnyPermission(user, perms)` | `frontend/src/lib/permissions.ts` | Returns `true` if `user` has any of the listed permissions. |
| `hasAllPermissions(user, perms)` | `frontend/src/lib/permissions.ts` | Returns `true` only if `user` possesses every listed permission. |
| `can(user, perm)` | `frontend/src/lib/permissions.ts` | Syntactic alias for `hasPermission` (allows readable code like `if (can(user, 'events.create'))`). |

---

## 6. Concrete Security Trace: A Member Attempting Privilege Escalation

Imagine a malicious student (`member@campus.edu`, Role: `MEMBER`) discovers the endpoint `PATCH /api/admin/users/:userId/role` and uses Postman to send a request promoting themselves to `ADMIN`:

```http
PATCH /api/admin/users/e390f4ef-d1a3-47ff-9a03-eccc4cb41b8e/role HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "role": "ADMIN"
}
```

Here is the exact step-by-step execution path:

```mermaid
sequenceDiagram
    autonumber
    actor Attacker as Member (Attacker)
    participant Server as Express Route Pipeline
    participant AuthMW as authenticate.middleware.ts
    participant AuthzMW as authorize.middleware.ts
    participant Service as auth.service.ts
    participant DB as Neon PostgreSQL

    Attacker->>Server: PATCH /api/admin/users/:userId/role
    Server->>AuthMW: authenticate()
    AuthMW->>AuthMW: Verify JWT Signature & Expiry
    AuthMW->>DB: Fetch user (id, role, status, tokenVersion)
    DB-->>AuthMW: User found: role = "MEMBER", status = "active", tokenVersion = 0
    AuthMW->>AuthMW: Injects req.user = { id, role: "MEMBER", ... }
    AuthMW->>AuthzMW: requirePermission('users.assign_roles')
    AuthzMW->>AuthzMW: hasPermission('MEMBER', 'users.assign_roles')
    Note over AuthzMW: ROLE_PERMISSIONS['MEMBER'] does NOT contain 'users.assign_roles'
    AuthzMW-->>Server: next(new ForbiddenError("You do not have permission...", "FORBIDDEN"))
    Note over Server: Execution immediately HALTS before validator or service
    Server-->>Attacker: HTTP 403 Forbidden { success: false, error: { code: "FORBIDDEN" } }
```

1. **Step 1**: The request arrives at Express and passes through Helmet, CORS, and JSON parsing.
2. **Step 2**: `authenticate` middleware extracts the JWT from the `Authorization` header. Signature is verified.
3. **Step 3**: `authenticate` queries PostgreSQL to verify the user exists and account is active. Injects `req.user` with `role: 'MEMBER'`.
4. **Step 4**: The request hits `requirePermission('users.assign_roles')` on [admin.routes.ts](file:///D:/Projects/CampusFlow/backend/src/routes/admin.routes.ts).
5. **Step 5**: `hasPermission('MEMBER', 'users.assign_roles')` checks the permissions array for `MEMBER`.
6. **Step 6**: The check returns `false`. `authorize.middleware.ts` creates a `ForbiddenError` (HTTP 403) and passes it to `next()`.
7. **Step 7**: **Execution stops immediately.** The request never reaches Zod validation, never executes `updateUserRole()`, and never writes to PostgreSQL.
8. **Step 8**: Centralized error middleware returns HTTP 403 Forbidden. The attack fails completely.

---

## 7. Guardrails, Safeguards & Session Invalidation

### 1. Last Active Administrator Protection
- **The Threat**: If an organization has only one `ADMIN` and that administrator accidentally or maliciously demotes themselves to `MEMBER`, the club would be permanently locked out of administrative functions with no way to assign new admins.
- **The Implementation** (in `backend/src/services/auth.service.ts`):
  Inside an atomic PostgreSQL transaction:
  ```typescript
  if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
    const activeAdminCount = await tx.user.count({
      where: { role: 'ADMIN', status: 'active' },
    });
    if (activeAdminCount <= 1) {
      throw new BadRequestError('Cannot demote or change the role of the last active administrator');
    }
  }
  ```
  If `activeAdminCount <= 1`, the server aborts the transaction and returns HTTP 400 Bad Request.

### 2. Session Invalidation via `tokenVersion`
- **The Threat**: When an administrator revokes a rogue volunteer's role or demotes an admin to a normal member, the target user might still hold an unexpired JWT access token on their laptop and continue making privileged API calls for up to 15 minutes.
- **The Implementation**:
  When `updateUserRole` succeeds, it atomically:
  1. Increments `tokenVersion` on the target user record: `data: { role: newRole, tokenVersion: { increment: 1 } }`.
  2. Revokes all active refresh tokens: `updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })`.
- **The Result**: The very next time the target user makes an API request with their old access token, `authenticate.middleware.ts` observes that `claims.tv (0) !== user.tokenVersion (1)` and rejects the request with HTTP 401 `TOKEN_REVOKED`. The user is forced to log in again with their updated, demoted permissions.
