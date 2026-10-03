# Phase 03 — Tickets, payments, and check-in

Backend only. The frontend was not changed in this phase.

## Decisions taken from the current schema

- Event prices are the existing integer `memberPrice` and `standardPrice` fields, treated as whole INR rupees. Razorpay is charged in paise (`rupees × 100`). Registration and payment rows store `amountPaise` and `currency` (`INR`).
- There is no registration-deadline column. Registration is open only while `status` is `PUBLISHED` and the current time is before `startsAt`.
- `totalCapacity: null` means the event has no seat limit. Otherwise the server increments `registeredCount` only when `registeredCount` is still below `totalCapacity`.
- An `ACTIVE` membership with `validUntil` in the future receives `memberPrice`. Pending, expired, and non-members pay `standardPrice`.
- A calculated amount of 0 confirms immediately and issues a ticket. A positive amount stays `PENDING_PAYMENT` until Razorpay reports the payment as `captured`.
- One user can hold one `PENDING_PAYMENT` or `CONFIRMED` registration per event. Cancelled and expired rows stay for history, and the person may register again.
- Card numbers, CVVs, and raw webhook payloads are not stored.

## Status transitions

Clients cannot set these statuses.

| Record | From | To |
|---|---|---|
| Registration | `PENDING_PAYMENT` | `CONFIRMED`, `CANCELLED`, `EXPIRED` |
| Registration | `CONFIRMED` | `CANCELLED` |
| Payment | `CREATED` | `PENDING`, `PAID`, `FAILED` |
| Payment | `PENDING` | `PAID`, `FAILED` |
| Payment | `FAILED` | `PENDING`, `PAID` (another attempt on the same order) |
| Payment | `PAID` | `REFUNDED` |
| Ticket | `ISSUED` | `USED`, `CANCELLED` |

`PAID` is not overwritten by a later `payment.failed` webhook. `USED` is terminal.

## Payment flow

1. `POST /api/events/:eventId/registrations` reserves a seat for the authenticated user.
2. For a paid registration, `POST /api/registrations/:registrationId/payment-order` creates the Razorpay order on the server and stores `razorpayOrderId`. Repeating the call returns the open order.
3. The browser opens Razorpay Checkout with the returned `keyId`, `razorpayOrderId`, and `amountPaise`. The key secret stays on the server.
4. `POST /api/payments/verify` checks the checkout signature with the official SDK helper (`order_id|payment_id` HMAC-SHA256 and `RAZORPAY_KEY_SECRET`), fetches the order and payment, and compares amount, currency, and order id with the stored row. Only `captured` marks the payment `PAID`, confirms the registration, and issues one ticket.
5. `POST /api/payments/webhook` reads the raw body, verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`, and stores `X-Razorpay-Event-Id` so retries are idempotent. `payment.captured` and `order.paid` settle the same way. `payment.failed` records failure only from a non-paid state. `refund.processed` records a full refund. This route does not use the JSON parser, so other routes still receive parsed JSON.

The server does not call Razorpay's refund API. A refund is recorded when Razorpay sends `refund.processed`. Partial refunds are ignored. If the attendee was already checked in, the payment can become `REFUNDED` while the ticket stays `USED`.

If order creation fails before a row is stored, the registration remains `PENDING_PAYMENT` and the next call can create the order. The seat stays reserved until payment, cancellation, or expiry at `startsAt`.

## QR tickets and check-in

A ticket token is `cf_` plus 32 random bytes, encoded as base64url. The database stores its SHA-256 hash and an AES-256-GCM ciphertext (key derived from `TICKET_ENCRYPTION_KEY`). The QR image contains only that token: no name, email, price, or JWT.

`POST /api/events/:eventId/tickets/validate` reports the result and does not change state. `POST /api/events/:eventId/check-in` is limited to users with `attendance.manage` who organize the event, or an admin with `events.manage_all`. It updates the ticket from `ISSUED` to `USED` only if that is still the status, then inserts one `check_ins` row. `check_ins.ticketId` is unique. A second request receives `409 ALREADY_CHECKED_IN`.

## Authorization

The Phase 01 permission map is unchanged.

- Registering, ordering, and verifying: the authenticated user, and only their own rows.
- Own tickets and registrations: `tickets.read_own`.
- Event roster: `events.registrations.read` plus organizer, or `events.manage_all`.
- Payment list: `payments.read` (ADMIN and TREASURER).
- Validate: `tickets.validate` plus event scope.
- Check-in and attendance: `attendance.manage` / `attendance.read` plus event scope.

Reading someone else's ticket or registration returns 404.

## Environment

See `backend/.env.example`.

| Variable | Purpose |
|---|---|
| `TICKET_ENCRYPTION_KEY` | Encrypts ticket tokens. Required in production, minimum 32 characters. Development uses an insecure default if unset. |
| `RAZORPAY_KEY_ID` | Public test key id returned to the client. |
| `RAZORPAY_KEY_SECRET` | Checkout signature verification and server API calls. Never sent to the browser. |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification. Separate from the key secret. |

Paid order creation returns 503 when the key id or secret is missing. The webhook returns 503 when its secret is missing.

## Migration

From `backend/`, with `DATABASE_URL` and `DIRECT_URL` set:

```bash
npx prisma migrate deploy
```

Use `npm run db:migrate` only in a private development database when you intend to apply migrations interactively. Do not run `prisma migrate reset` against the shared Neon database.

The Phase 03 migration is `20261003190000_phase03_tickets_payments_checkin`. It adds partial unique indexes that Prisma's schema language cannot express:

- one `PENDING_PAYMENT` or `CONFIRMED` registration per user per event
- one `CREATED` or `PENDING` payment per registration
- one `PAID` or `REFUNDED` payment per registration

Do not drop those indexes if a later schema diff does not show them.

## Local sandbox checks

Automated tests mock Razorpay. They do not create real orders. A manual sandbox check still needs test keys:

1. Copy the placeholders in `backend/.env.example` into `backend/.env` using Razorpay test mode values.
2. Apply the migration.
3. Register for a paid published event and create a payment order.
4. Complete Checkout in test mode and post the returned ids to `/api/payments/verify`.
5. In the Razorpay dashboard, point the test webhook at `https://<host>/api/payments/webhook` and subscribe to `payment.captured`, `payment.failed`, `order.paid`, and `refund.processed`.

This repository has not executed a live sandbox payment. Signature checks in tests use the official SDK helpers with test secrets.

## Known limits

- No separate registration deadline, refund initiation API, or partial-refund handling.
- Check-in is allowed for any `PUBLISHED` event; nothing marks an event `COMPLETED` automatically.
- Development ticket encryption uses a shared default until `TICKET_ENCRYPTION_KEY` is set.
- The in-memory test double serializes database transactions so concurrent tests are deterministic. The refresh-token overlap test still runs its two transactions together. Production behavior depends on PostgreSQL conditional updates and unique indexes, which the tests model but do not run against Neon.
