# CampusFlow — Viva, Review & Technical Interview Master Guide

This guide is designed for B.Tech Computer Science students and junior software engineers preparing for final-year project reviews, faculty viva examinations, and technical coding interviews. It translates the real implementation of **CampusFlow** into articulate spoken scripts, deep conceptual explanations, and rigorous code-tracing answers.

---

## Table of Contents
1. [Spoken Presentation Scripts](#1-spoken-presentation-scripts)
   - [5-Minute Project Pitch (Faculty / Evaluator Review)](#5-minute-project-pitch-faculty--evaluator-review)
   - [2-Minute Architecture Deep Dive](#2-minute-architecture-deep-dive)
   - [60-Second Technical Interview Elevator Pitch](#60-second-technical-interview-elevator-pitch)
2. [30+ Project-Specific Viva Questions & Model Answers](#2-30-project-specific-viva-questions--model-answers)
   - [Category 1: Architecture & System Design](#category-1-architecture--system-design)
   - [Category 2: Authentication & Security Architecture](#category-2-authentication--security-architecture)
   - [Category 3: Database & Prisma ORM](#category-3-database--prisma-orm)
   - [Category 4: Role-Based Access Control (RBAC)](#category-4-role-based-access-control-rbac)
   - [Category 5: Frontend & State Management](#category-5-frontend--state-management)
   - [Category 6: Testing & Quality Assurance](#category-6-testing--quality-assurance)
   - [Category 7: Limitations, Trade-offs & Future Work](#category-7-limitations-trade-offs--future-work)
3. [10 Code-Tracing Viva Scenarios](#3-10-code-tracing-viva-scenarios)
4. [Technical Glossary (Plain-English Definitions)](#4-technical-glossary-plain-english-definitions)
5. [Recommended Study & Review Order](#5-recommended-study--review-order)

---

## 1. Spoken Presentation Scripts

### 5-Minute Project Pitch (Faculty / Evaluator Review)

> **Spoken Script (Read aloud or present with slides):**
>
> "Good morning, respected professors and evaluators. Today, I am presenting **CampusFlow**, an enterprise-grade campus organization and event management web application designed for universities, student councils, and academic societies.
>
> **The Problem:**
> In most university campuses, student governance and event logistics are highly fragmented. Event registration happens on Google Forms, membership ticketing is tracked in ad-hoc Excel sheets, financial approvals occur over WhatsApp chats, and door check-ins are managed with paper rosters. This creates administrative overhead, duplicate ticket redemption, severe security vulnerabilities, and zero audit accountability.
>
> **Our Solution:**
> CampusFlow solves this by providing a unified, multi-tenant digital ecosystem powered by a four-role Role-Based Access Control (RBAC) architecture. We support **Administrators**, **Event Managers**, **Treasurers**, and **General Members**—ensuring that each campus stakeholder only accesses their authorized operational domain.
>
> **Technical Stack & Architecture:**
> On the frontend, we developed a Single Page Application using **React 19**, **TypeScript**, and **Vite**, utilizing **Zustand** for lightweight reactive state management and **Tailwind CSS** for an accessible design system.
>
> On the backend, we engineered a RESTful API service using **Node.js**, **Express**, and **TypeScript**, backed by **PostgreSQL** hosted on Neon Serverless and interfaced through **Prisma ORM**.
>
> **Core Engineering Highlights:**
> Instead of building a generic CRUD prototype, we focused heavily on enterprise security patterns:
> 1. **Dual-Token Authentication with Cryptographic Refresh Rotation:** We use short-lived 15-minute JWT access tokens and 7-day cryptographically secure refresh tokens stored as SHA-256 hashes in PostgreSQL. We implemented automatic Refresh Token Rotation with token reuse detection—if an attacker intercepts and replays a revoked token, the system instantly revokes the entire token family.
> 2. **Token Versioning for Instant Session Invalidation:** In standard stateless JWT systems, revoking access before expiration is impossible without Redis blocklists. We solved this using a database-backed `tokenVersion` counter. When an administrator reassigns a role or suspends an account, `tokenVersion` increments, invalidating all outstanding sessions across devices.
> 3. **Defensive Business Invariants:** We implemented automated guards such as the 'Last Active Administrator Guard'—preventing the accidental lockout of the system by enforcing that the final active admin cannot be demoted.
> 4. **Decoupled Route Guards vs Server Middleware:** We enforce security at both layers: client-side route guards prevent unauthorized navigation and provide immediate user feedback, while server-side middleware cryptographically authenticates and validates every inbound request. Client tampering has zero impact on server data.
>
> **Current Status & Verification:**
> Our authentication, four-role RBAC, administrative user management, and health monitoring pipelines are completely live end-to-end. Our events and membership management modules are fully implemented on the backend with 67 passing automated integration tests in Vitest.
>
> Thank you, and I look forward to your questions."

---

### 2-Minute Architecture Deep Dive

> **Spoken Script:**
>
> "From an architectural perspective, CampusFlow is structured around a strict separation of concerns across a decoupled client-server model.
>
> When an HTTP request enters our Node.js server, it traverses a structured 7-stage Express middleware pipeline:
> First, **Helmet** enforces HTTP security headers and prevents clickjacking. Second, **CORS** restricts cross-origin access to our authorized frontend origin. Third, our **Rate Limiter** protects against brute-force attacks by restricting authentication attempts to 5 requests per 15 minutes per IP.
>
> Fourth is our **Authentication Middleware**, which extracts the Bearer JWT, validates its cryptographic signature, checks expiration, fetches the user from PostgreSQL, and confirms that the token's embedded `tokenVersion` matches the database record.
>
> Fifth is our **Authorization Middleware**, which evaluates the user's role against our granular `ROLE_PERMISSIONS` dictionary using our `requirePermission` higher-order function.
>
> Sixth is our **Validation Middleware**, which uses **Zod schemas** to strictly validate route parameters, query strings, and request bodies before they reach business logic.
>
> Finally, the request enters our **Service Layer**, which coordinates database operations through **Prisma ORM** within ACID transaction boundaries. Any thrown errors are caught by our asynchronous error handler and normalized by our global error middleware into a consistent JSON response envelope.
>
> On the frontend, our Axios HTTP client contains a **Single-Flight Response Interceptor**. If an access token expires mid-session with a 401 response, the interceptor pauses concurrent outbound requests, fetches a new token pair using the refresh token, and seamlessly replays the original requests without user disruption."

---

### 60-Second Technical Interview Elevator Pitch

> **Spoken Script:**
>
> "I built CampusFlow, a full-stack campus management platform using React, Node.js, Express, TypeScript, and PostgreSQL with Prisma ORM.
>
> What makes this project technically interesting is its enterprise security architecture: I implemented a dual-token authentication system featuring Refresh Token Rotation with automatic family revocation upon reuse detection. To solve the classic JWT revocation problem, I engineered database-backed `tokenVersion` counters, allowing instant cross-device session termination when roles change.
>
> I also built a four-role granular RBAC system on both the client and server, protected database transactions using Prisma's interactive transaction API, and covered the backend with 67 Vitest integration tests across authentication, rate limiting, and domain modules."

---

## 2. 30+ Project-Specific Viva Questions & Model Answers

### Category 1: Architecture & System Design

#### Q1: Why did you choose a decoupled REST architecture instead of Server-Side Rendering (SSR) with Next.js?
**Answer:**
"We chose a decoupled Single Page Application (React + Vite) and REST API (Express + TypeScript) to maintain strict separation of concerns and independent deployment lifecycles. Campus organizations frequently require mobile clients (such as mobile QR scanners for door check-in staff). By designing a clean, stateless REST API adhering to standard JSON envelopes, our backend can serve both the web frontend and future mobile native apps without altering server logic."

#### Q2: What is the purpose of the 7-layer middleware pipeline in Express?
**Answer:**
"The 7-layer pipeline guarantees defensive, fail-fast request processing. Each layer has a single responsibility:
1. Security headers (`helmet`)
2. Cross-origin authorization (`cors`)
3. Body parsing (`express.json`)
4. Brute-force protection (`rateLimit`)
5. Identity verification (`authenticate.middleware.ts`)
6. Access control (`authorize.middleware.ts`)
7. Input validation (`validate.middleware.ts`)
If a request fails validation or lacks permissions, it is terminated immediately before executing costly database queries."

#### Q3: How do you handle unhandled asynchronous errors in Express routes?
**Answer:**
"Express 4 does not automatically catch rejected Promises in route handlers. We implemented an `asyncHandler` wrapper utility in `backend/src/utils/async-handler.ts`:
```typescript
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```
This guarantees that any unhandled exception or rejected Promise is forwarded directly to our centralized `errorHandler` middleware in `backend/src/middleware/error.middleware.ts`, preventing unhandled rejection crashes."

#### Q4: What is the structure of your API response envelope?
**Answer:**
"We standardized responses using helper functions in `backend/src/utils/response.ts`:
- **Success (`sendSuccess`)**: `{ status: 'success', data: { ... }, message?: string }`
- **Client Error (`sendFail`)**: `{ status: 'fail', message: string, errors?: any[], code?: string }`
- **Server Error (`sendError`)**: `{ status: 'error', message: string, code?: string }`
This predictable structure simplifies frontend Axios interceptor handling and error parsing."

#### Q5: How do you ensure environment variables are safe and valid on server launch?
**Answer:**
"In `backend/src/config/env.ts`, we validate all environment variables on boot using Zod (`envSchema`). If critical variables such as `DATABASE_URL` or `JWT_SECRET` are missing or malformed, the process immediately crashes with a clear schema validation error before opening any network sockets. This prevents silent runtime bugs."

#### Q6: Why did you use Vite instead of Create React App?
**Answer:**
"Create React App is officially deprecated and relies on Webpack with slow cold starts. Vite leverages native browser ES Modules (ESM) and esbuild during development, providing sub-second hot module replacement (HMR) and optimized Rollup production builds with efficient code-splitting."

---

### Category 2: Authentication & Security Architecture

#### Q7: Why do you use both an Access Token and a Refresh Token?
**Answer:**
"Security is a trade-off between exposure and convenience.
- An **Access Token** is short-lived (15 minutes) and sent with every API request. If an attacker intercepts it over the wire, their window of vulnerability is limited to minutes.
- A **Refresh Token** is long-lived (7 days), stored securely, and only transmitted to `/api/auth/refresh` to renew access tokens. This prevents the user from being repeatedly logged out while keeping the attack surface minimal."

#### Q8: How does your Refresh Token Rotation (RTR) mechanism work?
**Answer:**
"Whenever `/api/auth/refresh` is called:
1. The server verifies the incoming refresh token.
2. It marks that specific token as revoked (`revokedAt: new Date()`).
3. It issues a brand-new refresh token belonging to the same `familyId`.
4. It issues a new 15-minute access token.
If a malicious party steals an old refresh token and attempts to use it after it was already rotated, the server detects that the token was previously revoked, flags token reuse, and revokes all active tokens in that family immediately."

#### Q9: How does CampusFlow solve the problem of immediate session revocation with stateless JWTs?
**Answer:**
"We implemented a `tokenVersion` integer field on the `User` model in PostgreSQL.
1. When signing an access token, the current `tokenVersion` is embedded in the JWT payload.
2. The `authenticate` middleware fetches the user and verifies that `token.tokenVersion === user.tokenVersion`.
3. When an admin reassigns a user's role or the user clicks 'Logout all devices', the server increments `tokenVersion: { increment: 1 }` and revokes active refresh tokens.
Any subsequent API call with the old access token or refresh token is immediately rejected."

#### Q10: How are passwords stored and verified in CampusFlow?
**Answer:**
"Passwords are never stored in plaintext. In `backend/src/services/password.service.ts`, we use `bcrypt` with a salt cost factor of 12. During login, `verifyPassword` utilizes constant-time string comparisons to protect against timing attacks. The password hash is explicitly excluded from public responses using our `toPublicUser` presenter."

#### Q11: How do you prevent User Enumeration attacks during login?
**Answer:**
"In `loginUser` (`backend/src/services/auth.service.ts`), whether an email does not exist in the database or the password hash comparison fails, the service returns the exact same generic error: `UnauthorizedError('Invalid email or password')`. We also apply rate limiting (`authLimiter`) to throttle repeated attempts."

#### Q12: How are Refresh Tokens stored in the database?
**Answer:**
"Raw refresh tokens are never stored in the database. When a 64-character hex refresh token is generated via `crypto.randomBytes(32)`, the server computes its cryptographic SHA-256 hash and stores only `tokenHash` in the `refresh_tokens` table. Even if the database were compromised, the attacker cannot use the hashed values to authenticate."

---

### Category 3: Database & Prisma ORM

#### Q13: Why did you choose Prisma ORM over raw SQL or TypeORM?
**Answer:**
"Prisma provides full end-to-end type safety generated directly from our `schema.prisma` file. Changes to models instantly reflect across our TypeScript compiler. Prisma also abstracts database migrations safely via `prisma migrate dev`, manages connection pooling out-of-the-box, and prevents SQL injection by parameterizing all queries automatically."

#### Q14: What is the relationship between the `User` and `RefreshToken` models in Prisma?
**Answer:**
"It is a One-to-Many relationship defined as:
```prisma
model User {
  id           String         @id @default(uuid())
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id      String @id @default(uuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
`onDelete: Cascade` ensures that if a user account is deleted, all associated refresh tokens are automatically cleaned up."

#### Q15: Why did you use interactive Prisma transactions (`prisma.$transaction`) in `updateUserRole`?
**Answer:**
"Role updates require multiple atomic database operations:
1. Verify the active admin count.
2. Update the user's role and increment `tokenVersion`.
3. Mark all active refresh tokens as revoked.
If the server crashed between updating the role and revoking tokens, the database would be left in an inconsistent state. Using `prisma.$transaction(async (tx) => { ... })` ensures that all changes commit together or roll back completely."

#### Q16: What transaction isolation level is used in `updateUserRole` and why?
**Answer:**
"We explicitly set `{ isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }`. This ensures our transaction reads only committed data from other concurrent transactions, preventing dirty reads while maintaining high throughput."

#### Q17: What database indexes did you configure in Prisma and why?
**Answer:**
"In `backend/prisma/schema.prisma`:
- `User`: Unique index on `email`, standard index on `[role, status]`.
- `RefreshToken`: Unique index on `tokenHash`, composite indexes on `[userId, isRevoked]` and `[familyId]`.
- `Event`: Indexes on `[status, startDate]` and `[organizerId]`.
- `Membership`: Unique index on `memberCode`, indexes on `[userId, status]`.
These indexes optimize foreign key joins, login lookups, and filtered directory queries from $O(N)$ full table scans to $O(\log N)$ B-tree lookups."

#### Q18: What is the difference between `prisma db push` and `prisma migrate dev`?
**Answer:**
"`prisma db push` synchronizes the database schema directly without recording a migration history, which is risky for production. `prisma migrate dev` generates version-controlled SQL migration files in `prisma/migrations/`, tracks applied migrations in the `_prisma_migrations` table, and ensures repeatable schema evolution across development and staging environments."

---

### Category 4: Role-Based Access Control (RBAC)

#### Q19: What are the four roles in CampusFlow and what is the principle of least privilege?
**Answer:**
"The four roles are:
1. **ADMIN**: Full platform access (user management, role assignment, system configuration).
2. **EVENT_MANAGER**: Event creation, drafting, publishing, venue scheduling, and attendee check-ins.
3. **TREASURER**: Financial ledger management, budget tracking, and reimbursement approvals.
4. **MEMBER**: Public user browsing, event registration, purchasing tickets, and personal pass management.
The Principle of Least Privilege dictates that users are granted only the minimum permissions necessary to perform their specific responsibilities. For example, an Event Manager cannot view financial ledgers or reassign user roles."

#### Q20: What is the difference between a Role and a Permission?
**Answer:**
"- A **Role** is a high-level identity assigned to a user (e.g. `TREASURER`).
- A **Permission** is a fine-grained capability to perform an action on a resource (e.g. `treasury.view` or `events:create`).
Instead of hardcoding role checks throughout controllers, our backend checks permissions via `requirePermission('events:create')`. This decouples business logic from roles, allowing roles to be restructured without rewriting endpoint logic."

#### Q21: What is the 'Last Active Administrator Guard'?
**Answer:**
"In `backend/src/services/auth.service.ts` (lines 221–228), when an admin attempts to change a user's role from `ADMIN` to another role:
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
This guarantees that the system can never accidentally lock out all administrative access."

#### Q22: Why is client-side route protection insufficient on its own?
**Answer:**
"Client-side route guards (such as React Router's `<RequireAuth />`) run inside the user's browser, which is an untrusted environment. A user can open DevTools and modify local storage or component state. Therefore, frontend route guards exist solely for user experience and navigation control. True security is enforced on the backend, where every endpoint independently validates the cryptographic signature and permissions of the JWT."

#### Q23: Can an Event Manager access the `/admin/users` API endpoint?
**Answer:**
"No. The endpoint `GET /api/admin/users` is protected by `requirePermission('users.read')`. In `backend/src/middleware/authorize.middleware.ts`, `ROLE_PERMISSIONS['EVENT_MANAGER']` does not include `users.read`. The middleware throws a `403 Forbidden` error, and the controller is never reached."

---

### Category 5: Frontend & State Management

#### Q24: Why did you use Zustand instead of Redux Toolkit or React Context?
**Answer:**
"Redux Toolkit introduces substantial boilerplate (actions, reducers, dispatchers) that adds unnecessary complexity. React Context causes full component tree re-renders whenever any property in the context object changes. Zustand provides lightweight, hook-based state management with zero boilerplate and fine-grained selector subscriptions, ensuring components only re-render when the specific state slice they consume changes."

#### Q25: How does your frontend manage session hydration on page refresh?
**Answer:**
"In `frontend/src/App.tsx`, a mount `useEffect` calls `hydrate()` from `authStore.ts`.
1. It reads `campusflow_access_token` and `campusflow_refresh_token` from `localStorage`.
2. If absent, it sets `isInitialized: true` and `isAuthenticated: false`.
3. If present, it calls `GET /api/auth/me`. If valid, it hydrates user state. If expired, our Axios interceptor refreshes the tokens automatically.
4. While `isInitialized` is false, `<RequireAuth />` displays a spinner, preventing false redirects to `/login`."

#### Q26: What is the 'Single-Flight Refresh' pattern in your Axios client?
**Answer:**
"If a user opens multiple dashboard widgets that concurrently fire 5 API requests while the access token is expired, all 5 receive a 401. Without single-flight locking, the client would send 5 simultaneous refresh requests. Because our backend uses Refresh Token Rotation, the second request would attempt to use an already-revoked token and trigger a security lockdown.
Our Axios interceptor uses a lock variable (`isRefreshing = true`) and a subscriber queue (`failedQueue`). The first request performs the token refresh while subsequent requests wait; once renewed, all pending requests replay seamlessly."

#### Q27: How does React Router code-splitting work in `App.tsx`?
**Answer:**
"We use `React.lazy()` and `<Suspense fallback={<LoadingSpinner />}>` for all page components:
```typescript
const UserManagementPage = React.lazy(() => import('./features/admin/pages/UserManagementPage'));
```
This enables dynamic chunk loading via Vite. Users downloading the public landing page do not download administrative bundles until they navigate to `/admin`, keeping the initial bundle size small."

#### Q28: How does the `<RequireAuth />` component handle permission checks?
**Answer:**
"In `frontend/src/components/navigation/RequireAuth.tsx`:
1. It checks `isAuthenticated`. If false, navigates to `/login?from=${pathname}`.
2. If `allowedRoles` is passed, it checks `allowedRoles.includes(user.role)`.
3. If `allowedPermissions` is passed, it looks up `ROLE_PERMISSIONS[user.role]` in `frontend/src/lib/permissions.ts` and evaluates whether the user possesses the required capabilities.
4. If unauthorized, it displays a styled 'Access Restricted' warning without exposing protected child components."

---

### Category 6: Testing & Quality Assurance

#### Q29: What testing framework did you use and what is currently tested?
**Answer:**
"We used **Vitest** with **Supertest** for fast TypeScript integration testing.
The default suite is `npm test` in `backend/`. It currently includes health, rate-limit, auth, RBAC, events, memberships, registrations, payments, check-in, and Phase 4 merchandise/announcement tests. Those tests use an in-memory Prisma double.
PostgreSQL concurrency for merchandise is a separate command, `npm run test:postgres`, and it runs only when `PHASE4_TEST_DATABASE_URL` points at localhost."

#### Q30: How do your tests verify authorization boundaries?
**Answer:**
"In `backend/tests/rbac.test.ts`, we register and authenticate users for each role (`ADMIN`, `EVENT_MANAGER`, `TREASURER`, `MEMBER`). We then attempt forbidden operations—for example, making a `POST /api/events` request with a `MEMBER` token or a `GET /api/admin/users` request with an `EVENT_MANAGER` token—and assert that the response status code is strictly `403 Forbidden` with an appropriate error message."

---

### Category 7: Limitations, Trade-offs & Future Work

#### Q31: What is the current status of the frontend Events and Members views?
**Answer:**
"The backend Events (`/api/events`) and Membership (`/api/memberships`) modules are implemented with Prisma, Zod validation, and Vitest coverage.
On the frontend, `EventListPage.tsx` and `MemberListPage.tsx` still fall back to `MOCK_EVENTS` and `MOCK_MEMBERS` in `frontend/src/lib/mockData.ts` when the API is not used. The shop, order history, and announcement feed are already wired to the real API."

#### Q32: What modules are currently frontend-only prototypes?
**Answer:**
"Merchandise, pickup orders, and announcements now have Prisma models and backend routes (`/api/products`, `/api/orders`, `/api/announcements`). The shop and announcement screens call those APIs. Treasury and fundraisers are still mock UI with no backend tables. The check-in page still simulates a scan; the real endpoint is `POST /api/events/:eventId/check-in`. Tickets and Razorpay were Phase 3, not a future phase."

#### Q33: If you had another sprint, what would you improve?
**Answer:**
"1. Connect the existing backend Events and Membership APIs to the frontend pages.
2. Add Redis for distributed rate-limiting and token caching.
3. Integrate real camera stream processing with `@zxing/library` for the `/checkin` QR scanner.
4. Integrate a real payment gateway (such as Stripe or Razorpay) for membership dues."

---

## 3. 10 Code-Tracing Viva Scenarios

When an examiner asks: *"Trace what happens in the code when..."*, follow these exact sequences:

### Scenario 1: A user enters the wrong password 5 times
1. **Request 1 to 5:**
   - Client sends `POST /api/auth/login`.
   - `authLimiter` middleware checks client IP request count (limit: 5 per 15 minutes).
   - `loginUser` looks up the user, runs `bcrypt.compare`, and returns `false`.
   - Service throws `UnauthorizedError('Invalid email or password')`.
   - Controller sends `401 Unauthorized`.
2. **Request 6:**
   - Inbound request hits `authLimiter` (`backend/src/middleware/rate-limit.middleware.ts`).
   - Counter exceeds threshold (6 > 5).
   - Middleware halts execution immediately before invoking controllers or querying the database.
   - Returns `429 Too Many Requests` with `{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again after 15 minutes.' }`.

---

### Scenario 2: A logged-in Member types `/admin/users` into the browser URL bar
1. Browser routes to `/admin/users` matching the route in `frontend/src/App.tsx`.
2. Route is wrapped in `<RequireAuth allowedRoles={['ADMIN']} allowedPermissions={['users.assign_roles']}>`.
3. `RequireAuth.tsx` inspects Zustand store: `user.role` is `'MEMBER'`.
4. Check `allowedRoles.includes('MEMBER')` evaluates to `false`.
5. `<RequireAuth />` halts rendering of `<UserManagementPage />`.
6. Instead, it renders the styled Access Restricted warning banner informing the user that role `MEMBER` lacks administrative privileges.
7. If the user inspects network traffic, zero API requests were made to `/api/admin/users`.

---

### Scenario 3: An Admin attempts to demote the sole remaining Administrator
1. Admin opens `/admin/users` and selects the last Admin user.
2. Frontend sends `PATCH /api/admin/users/:userId/role` with `{ role: 'MEMBER' }`.
3. Request passes `authenticate`, `requirePermission('users.assign_roles')`, and parameter validation.
4. `updateUserRole` in `backend/src/services/auth.service.ts` enters a Prisma interactive transaction:
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
5. `activeAdminCount` returns `1`. Transaction aborts and throws `BadRequestError`.
6. `errorHandler` catches the error and sends `400 Bad Request`.
7. Frontend displays an error toast: *"Cannot demote or change the role of the last active administrator"*. The database remains unchanged.

---

### Scenario 4: The 15-minute access token expires while browsing
1. User clicks "My Memberships" which triggers `GET /api/memberships/me`.
2. Request arrives at `backend/src/middleware/authenticate.middleware.ts`.
3. `jwt.verify` throws `TokenExpiredError`.
4. Middleware throws `UnauthorizedError('Access token has expired')` with error code `'TOKEN_EXPIRED'`.
5. Server returns `401 Unauthorized`.
6. Frontend Axios response interceptor (`frontend/src/lib/authApi.ts`) catches the 401 error.
7. Interceptor checks `error.response?.data?.code === 'TOKEN_EXPIRED'` and acquires single-flight lock (`isRefreshing = true`).
8. Interceptor sends `POST /api/auth/refresh` sending `campusflow_refresh_token`.
9. Backend validates refresh token, updates DB, and issues new token pair.
10. Interceptor updates `localStorage`, attaches new Bearer token to original failed request, and replays `GET /api/memberships/me`.
11. User sees their membership data seamlessly with zero interruption or logout.

---

### Scenario 5: User logs out in one tab while multiple tabs are open
1. In Tab 1, user clicks "Log Out".
2. `authStore.logout()` fires `POST /api/auth/logout`.
3. Backend marks current refresh token as revoked (`revokedAt: new Date()`).
4. Tab 1 clears `localStorage` keys (`campusflow_access_token`, `campusflow_refresh_token`).
5. In Tab 2, the user clicks "Create Event".
6. If the short-lived access token is still within its 15-minute validity window, the request succeeds.
7. Once the access token expires, Tab 2 attempts to call `/api/auth/refresh`.
8. Tab 2 finds no refresh token in `localStorage` (or sends the revoked token).
9. Interceptor redirects Tab 2 to `/login`.

---

### Scenario 6: Malicious user edits `user.role` to 'ADMIN' in browser `localStorage`
1. User opens DevTools, executes `localStorage.setItem(...)`, or modifies Zustand store state in memory.
2. Frontend route guard `<RequireAuth />` may be bypassed locally, rendering the Admin UI shell.
3. User clicks "Promote to Admin", sending `PATCH /api/admin/users/123/role`.
4. Request arrives at backend with user's genuine JWT in `Authorization: Bearer <token>`.
5. `authenticate` middleware decodes token and queries PostgreSQL: `user.role` is `'MEMBER'`.
6. Request hits `requirePermission('users.assign_roles')`.
7. Middleware evaluates `ROLE_PERMISSIONS['MEMBER']`. It does not contain `'users.assign_roles'`.
8. Backend throws `ForbiddenError('Insufficient permissions')` and returns `403 Forbidden`.
9. The database remains completely untouched.

---

### Scenario 7: Two administrators change a user's role simultaneously
1. Admin A sends `PATCH .../role` with `{ role: 'EVENT_MANAGER' }`.
2. Admin B sends `PATCH .../role` with `{ role: 'TREASURER' }`.
3. Both hit `backend/src/services/auth.service.ts`'s `updateUserRole`.
4. Each call executes inside `prisma.$transaction(..., { isolationLevel: 'ReadCommitted' })`.
5. PostgreSQL places a row-level lock on `users` table for `targetUserId`.
6. Transaction A executes: sets role to `EVENT_MANAGER`, increments `tokenVersion`, revokes active refresh tokens, and commits.
7. Transaction B acquires lock, re-reads committed row: sets role to `TREASURER`, increments `tokenVersion` again, revokes active refresh tokens, and commits.
8. The database maintains strict consistency; the final role is `TREASURER`, and `tokenVersion` has incremented twice.

---

### Scenario 8: Neon PostgreSQL database restarts during an API call
1. Client sends `GET /api/events`.
2. Request passes authentication and reaches `event.service.ts`.
3. `prisma.event.findMany()` attempts to query PostgreSQL through the connection pool.
4. Connection fails or times out. Prisma throws a `PrismaClientInitializationError` or `PrismaClientKnownRequestError`.
5. Error is not caught locally, so it propagates to `asyncHandler`.
6. `errorHandler` middleware catches the exception:
   - Logs full stack trace to server console via `logger.error`.
   - Normalizes response to prevent leaking internal database connection strings:
   - Returns `500 Internal Server Error` with `{ status: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR' }`.

---

### Scenario 9: Attendant scans an unverified/tampered ticket QR code
1. Scanner interface captures QR payload: `{ ticketId: "fake-123", hash: "invalid-signature" }`.
2. Frontend sends verification request to backend.
3. Backend controller validates schema using Zod (`validateBody`).
4. Service queries database: `prisma.ticket.findUnique({ where: { id: ticketId } })`.
5. Ticket is not found in database (or cryptographic signature verification fails).
6. Service throws `NotFoundError('Ticket not found or invalid')`.
7. API responds with `404 Not Found` or `422 Unprocessable Entity`.
8. Check-in UI immediately sounds a failure buzzer and displays a red "INVALID TICKET" screen.

---

### Scenario 10: User submits registration with an existing email
1. User enters `admin@campus.edu` on `JoinPage.tsx` and clicks Submit.
2. Request passes `validateBody(registerSchema)` and reaches `registerUser` in `auth.service.ts`.
3. Service executes: `const existingUser = await prisma.user.findUnique({ where: { email } })`.
4. `existingUser` is found.
5. Service throws `ConflictError('An account with this email already exists')`.
6. `errorHandler` catches `ConflictError` (HTTP status 409).
7. Express responds with:
   ```json
   {
     "status": "fail",
     "message": "An account with this email already exists",
     "code": "CONFLICT"
   }
   ```
8. Frontend catches 409 and displays an alert banner: *"An account with this email already exists. Please log in instead."*

---

## 4. Technical Glossary (Plain-English Definitions)

- **JWT (JSON Web Token):** A compact, URL-safe string containing a Header, Payload, and Cryptographic Signature. It allows a client to prove its identity to a server without requiring server session storage.
- **Access Token:** A short-lived credential (15 minutes in CampusFlow) used in HTTP Bearer headers to access protected resources.
- **Refresh Token:** A long-lived credential (7 days in CampusFlow) used exclusively to obtain fresh access tokens when old ones expire.
- **Refresh Token Rotation (RTR):** A security pattern where every time a refresh token is used, it is invalidated and replaced with a brand-new refresh token, protecting against replay attacks.
- **Token Versioning (`tokenVersion`):** An integer stored on the user record and embedded in JWTs. Incrementing this counter instantly invalidates all previously issued tokens across all devices.
- **RBAC (Role-Based Access Control):** An authorization mechanism where system permissions are grouped into Roles (`ADMIN`, `EVENT_MANAGER`, etc.), and users are assigned roles rather than individual permissions.
- **Single-Flight Request Locking:** A concurrency design pattern that ensures only one refresh request is dispatched over the network when multiple simultaneous requests fail with 401.
- **Prisma Interactive Transaction:** A transaction API (`prisma.$transaction(async (tx) => { ... })`) that ensures multiple database queries either all succeed or all roll back together.
- **Zod Schema Validation:** A TypeScript-first data validation library that inspects and sanitizes runtime objects against declared type schemas before executing business logic.
- **bcrypt:** A password hashing function designed with a configurable work factor (salt rounds) to remain resistant to brute-force and hardware acceleration attacks.
- **Hydration (Auth Store):** The process on application startup where stored session tokens in browser `localStorage` are validated with the server and populated into active React memory.
- **Rate Limiting:** Restricting the number of requests a single IP address can make to an API within a specific timeframe to prevent Denial of Service and credential-stuffing attacks.
- **Helmet:** Express middleware that sets security-related HTTP headers such as HSTS, Content-Security-Policy, and X-Frame-Options.
- **CORS (Cross-Origin Resource Sharing):** A browser security protocol that restricts web pages running on one origin from making API requests to a server on a different origin.

---

## 5. Recommended Study & Review Order

To prepare effectively for your project presentation and viva examination, review the four guides in this sequence:

```
Step 1: Read CAMPUSFLOW_VIVA_PREPARATION.md (This File)
  │     Focus: Practice the 5-Minute Pitch, 2-Minute Architecture, and 60-Second Interview Scripts aloud.
  │
Step 2: Read CAMPUSFLOW_ROLE_PERMISSIONS.md
  │     Focus: Memorize the 4 roles, permissions matrix, requirePermission mechanics, and last admin protection.
  │
Step 3: Read CAMPUSFLOW_APPLICATION_FLOWS.md
  │     Focus: Study the Mermaid diagrams for Login, Hydration, Single-Flight Refresh, and Role Reassignment.
  │
Step 4: Read CAMPUSFLOW_CODEBASE_GUIDE.md
  │     Focus: Review real file locations, directory architecture, database schemas, and passing test suites.
  │
Step 5: Code-Tracing Drills
        Select 3 random scenarios from Section 3 above and trace them line-by-line in the actual source code.
```
