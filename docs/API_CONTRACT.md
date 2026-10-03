# CampusFlow API Contract & Error Conventions

This document establishes the standardized API request, response, and error handling contract across the entire CampusFlow platform for both Frontend and Backend engineers.

---

## 1. Response Envelope

Every API response from the CampusFlow backend returns a standard JSON envelope with a top-level boolean `success` flag.

### 1.1 Success Response

When an operation completes successfully:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* Payload object or array */
  }
}
```

- `success` (boolean): Always `true` for 2xx responses.
- `message` (string): Human-readable confirmation of the outcome.
- `data` (object | array | null): The payload containing the requested resource(s). For operations returning empty payloads (such as 204 or void actions), `data` is empty `{}` or `null`.

### 1.2 Error Response

When an error occurs (client-side or server-side):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ]
  }
}
```

- `success` (boolean): Always `false` for 4xx and 5xx responses.
- `error.code` (string): Machine-readable uppercase snake_case identifier (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `SERVICE_UNAVAILABLE`).
- `error.message` (string): Safe, user-friendly explanation of the error. Raw database error messages, stack traces, and internal secrets are NEVER exposed here.
- `error.details` (array): Optional array of specific field-level errors or diagnostic details.

---

## 2. HTTP Status Code Conventions

| Status Code | Meaning | Usage in CampusFlow |
|---|---|---|
| **200 OK** | Success | Standard read or update responses |
| **201 Created** | Created | Resource successfully created (POST) |
| **204 No Content** | No Content | Successful deletion or state change with no response body |
| **400 Bad Request** | Client Error | Malformed JSON, missing headers, or syntactically invalid input |
| **401 Unauthorized** | Unauthenticated | Missing or expired authentication token (Phase 01+) |
| **403 Forbidden** | Unauthorized | Authenticated user lacks permission to access the resource |
| **404 Not Found** | Resource Missing | Endpoint does not exist or target entity not found in database |
| **409 Conflict** | Conflict | Unique constraint violation (e.g., duplicate slug, existing registration) |
| **422 Unprocessable Entity** | Semantic Validation | Payload structurally valid but fails business rules or Zod schema |
| **429 Too Many Requests** | Rate Limited | Client exceeded request rate limit threshold |
| **500 Internal Server Error** | Server Error | Unhandled server error (sanitized message sent to client) |
| **503 Service Unavailable** | Dependency Down | Database or upstream service unreachable (e.g., readiness check fail) |

---

## 3. Standard Request Headers

- `Content-Type`: `application/json` (for POST, PUT, PATCH requests)
- `X-Request-Id`: Optional incoming correlation ID. If not supplied, the backend assigns a unique UUIDv4 and returns it in the response header `X-Request-Id`.
- `Origin`: Validated against configured `FRONTEND_URL` allowed origins.

---

## 4. Phase 00 Endpoints

### 4.1 Liveness Probe
- **Method**: `GET`
- **Path**: `/api/health`
- **Status**: `200 OK`
- **Response**:
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "service": "campusflow-backend",
    "timestamp": "2026-10-03T11:00:00.000Z"
  }
}
```

### 4.2 Readiness Probe
- **Method**: `GET`
- **Path**: `/api/health/ready`
- **Status**: `200 OK` (when database responds) or `503 Service Unavailable` (when database is down/disconnected)
- **Success (200)**:
```json
{
  "success": true,
  "message": "Service is ready",
  "data": {
    "status": "READY",
    "database": "CONNECTED",
    "timestamp": "2026-10-03T11:00:00.000Z"
  }
}
```
- **Failure (503)**:
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database readiness check failed",
    "details": []
  }
}
```

### 4.3 API Information
- **Method**: `GET`
- **Path**: `/api`
- **Status**: `200 OK`
- **Response**:
```json
{
  "success": true,
  "message": "CampusFlow API is online",
  "data": {
    "name": "CampusFlow API",
    "version": "0.1.0",
    "phase": "00-foundation",
    "docs": "/api/docs"
  }
}
```

### 4.4 Swagger Documentation
- **Method**: `GET`
- **Path**: `/api/docs`
- **Interactive UI**: Swagger UI rendering the OpenAPI 3.0 specification.

---

## 5. Phase 01 Authentication

Authentication is JWT. The access token is a signed bearer token. The refresh token is an opaque random value stored on the server only as a SHA-256 hash.

The frontend client should read `data.token` and send `Authorization: Bearer <token>`. `data.refreshToken` is sent only to `POST /api/auth/refresh`. Do not put the refresh token in the Authorization header.

Platform roles are `member`, `volunteer`, `door_staff`, `treasurer`, and `admin`. Public registration always creates `member`. The frontend `Role` union (`student`, `club_lead`, `faculty_advisor`, `admin`) is not the backend contract.

### 5.1 Permission matrix

| Permission | member | volunteer | door_staff | treasurer | admin |
|---|---|---|---|---|---|
| Read own profile | yes | yes | yes | yes | yes |
| Update own name | yes | yes | yes | yes | yes |
| Read another user's profile | no | no | no | no | yes |
| List users | no | no | no | no | yes |
| Change role, status, or password hash | no | no | no | no | no |

There is no API for changing a role. Privileged roles are assigned directly in the database. Club and event permissions are out of scope for Phase 01.

### 5.2 Token lifecycle

- Access tokens expire after `JWT_ACCESS_TTL_SECONDS` (default 900 seconds).
- Access token claims are `sub` (user id), `tv` (token version), and `typ: "access"`, plus issuer `campusflow`, audience `campusflow-api`, expiry, and a token id. Email, name, role, and password are not in the token.
- Refresh tokens expire after `JWT_REFRESH_TTL_DAYS` (default 7).
- `POST /api/auth/refresh` revokes the presented refresh token and stores its replacement in one database transaction. The new pair is returned only after that transaction commits. A failed transaction leaves the presented refresh token usable.
- Two overlapping uses of the same refresh token cannot both rotate it. The conditional update allows one replacement. The loser receives `401` and leaves that replacement in place.
- Presenting a refresh token that was already consumed revokes every still-active token in that family.
- `POST /api/auth/logout` requires the access token. In one transaction it increments the user's token version and revokes all of that user's refresh tokens. This signs out every device. If that transaction fails, the response is not success and existing tokens stay valid.
- An access token presented after a committed logout fails with `401 TOKEN_REVOKED` even if it has not reached its expiry.
- Deleting the token from browser memory is not server-side revocation. The client must call logout.
- Unknown users, wrong passwords, and disabled accounts all receive the same public sign-in error. Refresh uses the same generic invalid-token error for an unknown, expired, replayed, or disabled-account token. A still-valid access token for an account that is disabled later is rejected with `403 ACCOUNT_DISABLED`.

### 5.3 Register

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: none
- **Rate limit**: `AUTH_RATE_LIMIT_MAX` requests per `AUTH_RATE_LIMIT_WINDOW_MS` per IP (default 10 per 15 minutes), shared with login and refresh
- **Body**: `name` (1–80 chars), `email`, `password` (8–72 chars, at least one letter and one number)
- **Rejected fields**: `role`, `status`, `passwordHash`, and any other extra field (`422`)
- **201**:

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "uuid",
    "email": "ada@campus.edu",
    "name": "Ada Lovelace",
    "role": "member",
    "status": "active",
    "createdAt": "2026-10-03T12:00:00.000Z",
    "updatedAt": "2026-10-03T12:00:00.000Z"
  }
}
```

- **409** `CONFLICT`: email already exists. The same response is used for normalized duplicates.
- **422** `VALIDATION_ERROR`
- **429** `RATE_LIMITED`

### 5.4 Login

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: none
- **Body**: `email`, `password`. A `role` field, if sent by the current frontend type, is ignored and cannot change the authenticated role.
- **200**:

```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "token": "<jwt>",
    "refreshToken": "<opaque>",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "ada@campus.edu",
      "name": "Ada Lovelace",
      "role": "member",
      "status": "active",
      "createdAt": "2026-10-03T12:00:00.000Z",
      "updatedAt": "2026-10-03T12:00:00.000Z"
    }
  }
}
```

- **401** `INVALID_CREDENTIALS`: unknown email, wrong password, and disabled accounts return the same message, `Invalid email or password`. The response does not say whether the account exists or is disabled.
- **422** `VALIDATION_ERROR`
- **429** `RATE_LIMITED`

### 5.5 Refresh

- **Method**: `POST`
- **Path**: `/api/auth/refresh`
- **Auth**: none. Send `{ "refreshToken": "<opaque>" }`.
- **200**: same session shape as login, with a new access token and a new refresh token.
- **401** `INVALID_REFRESH_TOKEN`: missing, unknown, expired, replayed, or disabled-account token. The message is `Invalid or expired refresh token`.
- **500** `INTERNAL_SERVER_ERROR`: the rotation transaction failed. The presented refresh token remains valid.
- **422** `VALIDATION_ERROR`
- **429** `RATE_LIMITED`

### 5.6 Logout

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Auth**: bearer access token
- **200**: `data` is `null`. Message: `Signed out successfully`. Both the token-version update and refresh-token revocation committed.
- **401**: missing, malformed, invalid, expired, or already revoked access token.
- **500** `INTERNAL_SERVER_ERROR`: the logout transaction failed. Access and refresh tokens from before the request remain valid.

### 5.7 Current user

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: bearer access token
- **200**: `data` is the public user object.
- **401** or **403** as described in the token lifecycle.

- **Method**: `PATCH`
- **Path**: `/api/auth/me`
- **Auth**: bearer access token
- **Body**: `{ "name": "New Name" }` only
- **200**: updated public user
- **422**: missing name, or any attempt to send `role`, `status`, `email`, or `passwordHash`

`GET /api/users/me` is not implemented. The current user is `GET /api/auth/me`.

### 5.8 User profile by id

- **Method**: `GET`
- **Path**: `/api/users/:userId`
- **Auth**: bearer access token
- **200**: the caller is reading their own id, or the caller is an admin
- **403** `FORBIDDEN`: any other authenticated role reading someone else's id
- **404** `NOT_FOUND`: admin requests an unknown id
- **422**: `userId` is not a UUID

### 5.9 Admin user list

- **Method**: `GET`
- **Path**: `/api/admin/users`
- **Auth**: bearer access token and role `admin`
- **200**: `{ "users": [PublicUser] }` with at most 100 users
- **403**: every non-admin role

### 5.10 Frontend integration

- Base URL remains the configured API origin plus `/api`.
- Send `Content-Type: application/json` and `Authorization: Bearer <data.token>` on protected calls.
- Persist `data.token` where the existing client reads `campusflow_token`.
- Persist `data.refreshToken` separately. Call `POST /api/auth/refresh` when the API returns `401` `TOKEN_EXPIRED`, then retry the original request with the new access token.
- Call `POST /api/auth/logout` with the bearer token before clearing local storage.
- Do not send `role` on registration. Registration cannot create an admin.
- Use HTTPS in deployed environments. Tokens are bearer credentials, not cookies, so this API does not use CSRF cookies.
- Password hashes, refresh-token hashes, and token versions are never returned.

## 6. Phase 03 — registrations, payments, tickets, and check-in

All protected routes use `Authorization: Bearer <access token>`. List endpoints accept `page` (default 1) and `limit` (default 20, max 100) and return `pagination: { total, page, limit, totalPages }`.

Monetary amounts on these routes are integer **paise**. Event `memberPrice` and `standardPrice` remain integer **INR rupees**. The server multiplies by 100. Clients must not submit an amount, currency, user id, or payment status.

There is no `registrationDeadline` column. A `PUBLISHED` event accepts registrations until `startsAt`. `totalCapacity: null` means unlimited. An `ACTIVE` membership whose `validUntil` is still in the future receives `memberPrice`; every other user pays `standardPrice`. A zero amount confirms immediately and issues a ticket. A positive amount stays `PENDING_PAYMENT` until a captured Razorpay payment is verified.

A user may have only one `PENDING_PAYMENT` or `CONFIRMED` registration per event. After `CANCELLED` or `EXPIRED`, they may register again. Cancelling a checked-in registration is rejected.

### 6.1 Permission matrix

| Action | Who |
|---|---|
| Register, create a payment order, verify a payment | Any active authenticated user, for their own registration only |
| `GET /api/registrations/me`, `GET /api/tickets/me`, `GET /api/tickets/:id/qr` | `tickets.read_own` (every role) |
| `GET /api/events/:eventId/registrations` | `events.registrations.read` and the event organizer, or `events.manage_all` (ADMIN) |
| Cancel another user's registration | `events.registrations.manage` and the same event scope. Owners can cancel their own |
| `GET /api/payments` | `payments.read` (ADMIN, TREASURER) |
| Validate a ticket | `tickets.validate` and event organizer, or ADMIN |
| Check in and read attendance | `attendance.manage` / `attendance.read` and event organizer, or ADMIN |
| Webhook | No JWT. `X-Razorpay-Signature` over the raw body using `RAZORPAY_WEBHOOK_SECRET` |

EVENT_MANAGER can manage only events they organize. TREASURER cannot list registrations or check people in. A member cannot check themselves in.

### 6.2 Register

- **Method**: `POST`
- **Path**: `/api/events/:eventId/registrations`
- **Auth**: bearer token. The user id is taken from the token.
- **201**: `data.registration`, `data.ticket` (free events, including `qrToken` and `qrDataUrl`), `data.payment` (`null` until an order is created)
- **401** `UNAUTHORIZED`
- **404** `NOT_FOUND`: missing event, or a non-published event hidden from the caller
- **400** `EVENT_NOT_OPEN` or `REGISTRATION_CLOSED`
- **409** `ALREADY_REGISTERED` or `CAPACITY_REACHED`

### 6.3 Read registrations

- `GET /api/registrations/me` — own rows, with event summary and ticket status. No QR token.
- `GET /api/registrations/:registrationId` — owner, or staff allowed to manage that event. Anyone else receives **404**, including when the row exists.
- `GET /api/events/:eventId/registrations` — staff roster. Query `status` optional. Ticket tokens are omitted.
- `POST /api/registrations/:registrationId/cancel` — owner or managing staff. Open payments are marked `FAILED`. A paid payment stays `PAID` until a refund webhook. The seat is released.

### 6.4 Payment order

- **Method**: `POST`
- **Path**: `/api/registrations/:registrationId/payment-order`
- **Auth**: owner of the registration
- **201**: new order. `data.payment` includes `razorpayOrderId`, `amountPaise`, `currency`, `status: CREATED`, and public `keyId`
- **200**: an open order already exists (`data.alreadyExisted: true`)
- **404**: missing registration or another user's registration
- **409** `ALREADY_CONFIRMED` or `REGISTRATION_NOT_PAYABLE`
- **503** `SERVICE_UNAVAILABLE`: Razorpay is not configured or the provider request failed

The key secret is never returned.

### 6.5 Verify payment

- **Method**: `POST`
- **Path**: `/api/payments/verify`
- **Body**: `{ "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }`
- **200**: signature valid, provider payment is `captured`, amount and currency match the stored order. Registration becomes `CONFIRMED` and one ticket is issued. Repeating the same request returns the same ticket.
- **400** `INVALID_SIGNATURE`: state is not changed
- **404**: unknown order, or the order belongs to someone else
- **409** `PAYMENT_MISMATCH`, `PAYMENT_PENDING`, `PAYMENT_FAILED`, `PAYMENT_ALREADY_COMPLETED`
- **503**: provider fetch failed

A frontend "payment successful" message is not accepted. Pending and failed provider statuses do not issue tickets.

### 6.6 Webhook

- **Method**: `POST`
- **Path**: `/api/payments/webhook`
- **Auth**: none. Header `X-Razorpay-Signature` is HMAC-SHA256 of the raw body with `RAZORPAY_WEBHOOK_SECRET` (not the checkout key secret). `X-Razorpay-Event-Id` is the idempotency key.
- **200**: `{ duplicate, ignored, outcome }` for `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, and ignored event types
- **400** `INVALID_SIGNATURE` or a signed payload that cannot be parsed
- A `payment.failed` delivery does not downgrade `PAID`. A duplicate event id does not issue a second ticket.
- `refund.processed` marks a full refund `REFUNDED` and cancels an unused ticket. Partial refunds are ignored. A ticket that was already checked in stays `USED`.

### 6.7 Tickets, validation, and check-in

- `GET /api/tickets/me` — own tickets. `qrAvailable` is true for `ISSUED` and `USED`.
- `GET /api/tickets/:ticketId` — owner, or check-in staff for that event. Otherwise **404**.
- `GET /api/tickets/:ticketId/qr` — owner only. Returns `qrToken` and `qrDataUrl`. The QR payload is only the opaque `cf_` token.
- `POST /api/events/:eventId/tickets/validate` body `{ "token" }` — does not change state. `data.result` is `VALID`, `USED`, `CANCELLED`, `UNPAID`, `WRONG_EVENT`, or `INVALID`.
- `POST /api/events/:eventId/check-in` body `{ "token" }`
  - **200** `data.result = CHECKED_IN`
  - **409** `ALREADY_CHECKED_IN`, `TICKET_CANCELLED`, `TICKET_UNPAID`, `TICKET_EVENT_MISMATCH`, `EVENT_NOT_OPEN`
  - **404** `TICKET_INVALID`
  - **403** missing `attendance.manage`, or the caller does not organize the event
  - **422** malformed token
- `GET /api/events/:eventId/attendance` — paginated check-ins for authorized staff
- `GET /api/payments` and `GET /api/payments/:paymentId` — finance read. A payment that is not yours is **404** unless the caller has `payments.read`.

Check-in updates the ticket from `ISSUED` to `USED` only when that is still its status, and inserts one `check_ins` row per ticket. The second request cannot succeed.
