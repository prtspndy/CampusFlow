# CampusFlow — Multi-Quantity Event Ticket Booking + Razorpay Payment Integration Report

**Date:** October 4, 2026  
**Status:** Completed & Verified  
**Author:** Senior Full-Stack & Payment Integration Engineer  

---

## 1. Executive Summary

CampusFlow has been upgraded with a production-grade, end-to-end multi-quantity event ticket booking workflow integrated with Razorpay payments and cryptographic ticket issuing.

Prior to this implementation:
1. The database enforced a strict 1-to-1 relationship between `EventRegistration` and `Ticket` via a unique constraint on `Ticket.registrationId`, preventing a single booking from holding multiple tickets.
2. The registration route and service only allowed single-ticket booking, incrementing capacity by 1 and issuing exactly 1 ticket.
3. The frontend `EventDetailPage` offered only a single "Register" button without quantity selection, live breakdown, or complete Razorpay SDK checkout integration.

With this implementation:
- Authenticated members can select any quantity from **1 to 10** tickets (clamped to available event capacity).
- Live pricing displays member rates vs standard rates, with live order summary (Rate, Quantity, Subtotal, Taxes/Fees: ₹0, Total INR).
- Server-side Razorpay order creation computes total integer paise (`unitPrice * quantity * 100`).
- The official Razorpay Checkout SDK (`https://checkout.razorpay.com/v1/checkout.js`) is loaded dynamically and launched with full prefilled customer data.
- Payments are verified server-side with HMAC-SHA256 signature verification against provider capture status.
- Verification idempotently issues exactly $N$ distinct tickets for the booking, each possessing a unique `id`, unique AES-GCM encrypted verification token, unique SHA-256 token hash, and independent QR code.
- Each ticket is individually verifiable and can be checked in independently by door staff.
- Admin & Treasurer financial dashboards and treasury ledgers automatically aggregate multi-ticket revenue accurately via captured `Payment.amountPaise`.

---

## 2. Database Schema & Migration Architecture

### Migration: `20261004120000_multi_ticket_quantity`

Deployed directly to the PostgreSQL database on Neon:
```sql
-- AlterTable
ALTER TABLE "event_registrations" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX IF EXISTS "tickets_registrationId_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tickets_registrationId_idx" ON "tickets"("registrationId");
```

### Prisma Schema Updates (`backend/prisma/schema.prisma`)
1. **`EventRegistration`**:
   - Added `quantity Int @default(1)`
   - Changed `ticket Ticket?` to `tickets Ticket[]` (1-to-many relationship).
2. **`Ticket`**:
   - Removed `@unique` from `registrationId String`.
   - Added non-unique index `@@index([registrationId])`.
3. Generated fresh Prisma Client (v6.19.3).

---

## 3. Concurrency-Safe Capacity & Inventory Management

To prevent overselling under high concurrency, seat reservations use an optimistic check loop in `backend/src/services/registration.service.ts`:

```typescript
async function reserveSeat(tx: Tx, eventId: string, quantity = 1): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await tx.event.findUnique({ where: { id: eventId } });
    if (!current || current.status !== EventStatus.PUBLISHED) {
      return false;
    }
    if (current.totalCapacity !== null && current.registeredCount + quantity > current.totalCapacity) {
      return false;
    }
    const reserved = await tx.event.updateMany({
      where: {
        id: current.id,
        status: EventStatus.PUBLISHED,
        registeredCount: current.registeredCount,
        OR: [{ totalCapacity: null }, { totalCapacity: { gte: current.registeredCount + quantity } }],
      },
      data: { registeredCount: { increment: quantity } },
    });
    if (reserved.count === 1) {
      return true;
    }
  }
  return false;
}
```

### Cancellation & Expiration
- Cancelling a registration (`cancelRegistration`) validates that no tickets belonging to that registration have been checked in (`status === USED`).
- Upon cancellation or expiration, all unused tickets are transitioned to `CANCELLED` and exactly `registration.quantity` seats are atomically released back to the event capacity.

---

## 4. Razorpay Integration & Cryptographic Ticket Issuing

### Server-Side Order & Payment Verification (`backend/src/services/payment.service.ts`)
1. **Order Creation (`POST /api/registrations/:registrationId/payment-order`)**:
   - Order amount: `registration.amountPaise` (already calculated as `unitPricePaise * quantity`).
   - Order metadata notes store `registrationId`, `eventId`, `userId`, and `quantity`.
   - Returns client-facing public `keyId` while keeping `RAZORPAY_KEY_SECRET` strictly on the server.
2. **Payment Verification (`POST /api/payments/verify`)**:
   - Strictly validates `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
   - Verifies HMAC-SHA256 signature (`orderId|paymentId`).
   - Cross-checks provider status via Razorpay REST API (`status === 'captured'`).
   - Idempotently issues $N$ tickets via `issueTicketsForRegistration(tx, registration)`:
     - If tickets already exist for this registration, returns existing tickets.
     - Generates cryptographically secure `cf_` verification tokens, AES-GCM encrypted tokens for owner re-display, and SHA-256 hashes for O(1) scanner lookup.
3. **Refund Webhook (`POST /api/payments/webhook`)**:
   - Idempotently marks payment `REFUNDED`.
   - Cancels all issued tickets.
   - Decrements event `registeredCount` by `registration.quantity`.

---

## 5. Frontend Experience & Booking Workflow

### Enhancements to `frontend/src/features/events/EventDetailPage.tsx`
1. **Interactive Multi-Quantity Selector**:
   - `-` and `+` quantity stepper buttons and direct numeric input.
   - Bounded between 1 and available remaining capacity (capped at 10 max per transaction).
   - Dynamic member price recognition (checks active membership to show "Member Rate Applied").
2. **Live Order Summary**:
   - Shows unit rate, quantity, subtotal, and final total in INR.
   - Dynamic CTA: "Book N Tickets • ₹X" or "Register for Free (N passes)".
3. **Razorpay Checkout Modal**:
   - Displays complete order breakdown and Order ID.
   - Dynamically loads `https://checkout.razorpay.com/v1/checkout.js` using `loadRazorpayCheckoutScript()`.
   - Launches Razorpay modal with custom branded theme (`#0047FF`), prefilled member name and email.
   - Seamlessly verifies signature upon payment completion without manual data entry.
   - Provides manual payment verification fallback for local developer testing.
4. **Confirmed Passes Modal**:
   - Immediately displays all $N$ issued tickets with scannable QR pass previews and pass IDs.
   - Direct link to "View in My Tickets" (`/my-tickets`).
5. **My Tickets Page (`frontend/src/features/tickets/MyTicketsPage.tsx`)**:
   - Displays all issued passes individually with their own QR codes, pass numbers, and door check-in states.

---

## 6. Verification & Test Evidence

### Backend Test Suite (`vitest run`)
- **11 / 11 test suites passing (154 tests passing)**:
  - `tests/registrations.test.ts` (20 passed):
    - Multi-quantity registration on free events (issues 3 distinct tickets with distinct QR tokens).
    - Multi-quantity pricing calculation (`unitPrice * quantity`).
    - Capacity enforcement and boundary rejection when quantity exceeds remaining capacity.
    - Quantity validation (rejection of 0, negative numbers, > 10).
    - Cancellation releasing all $N$ seats.
  - `tests/payments.test.ts` (25 passed):
    - Payment verification issuing exactly $N$ unique tickets.
    - Idempotent re-verification returning identical tickets.
    - Webhook refund cancelling all tickets and restoring capacity.
  - All existing RBAC, auth, events, checkin, phase4, and phase5 tests passing.

### Frontend Test Suite & Builds
- **Vitest**: `7 passed (53 tests passed)`.
- **TypeScript Typecheck**: `npx tsc --noEmit` passed with 0 errors in both frontend and backend.
- **Production Builds**:
  - Backend: `npm run build` (`tsc`) succeeded with 0 errors.
  - Frontend: `npm run build` (`tsc -b && vite build`) succeeded with 0 errors.
- **Dev Servers**: Both Vite frontend (`http://localhost:5173`) and Express backend (`http://localhost:5000`) verified online and communicating.

---

## 7. Audit Checklist

| Requirement | Status | Verification |
|---|---|---|
| Multi-ticket quantity selection (1-10) | Completed | Frontend stepper + Zod validator `registerForEventSchema` |
| Authoritative backend pricing calculation | Completed | `quoteEventPrice` × `quantity` in paise |
| Concurrency-safe capacity decrement | Completed | `reserveSeat` optimistic check + updateMany |
| Drop 1-to-1 unique constraint on Ticket | Completed | Migration `20261004120000_multi_ticket_quantity` |
| Exactly $N$ distinct tickets issued | Completed | `issueTicketsForRegistration` with distinct QR hashes |
| Independent check-in per ticket | Completed | `validateTicket` & `checkInTicket` by token |
| Razorpay SDK checkout integration | Completed | `loadRazorpayCheckoutScript` + `new window.Razorpay()` |
| Server-side HMAC-SHA256 verification | Completed | `verifyPayment` in `payment.service.ts` |
| Idempotent verification & webhooks | Completed | Verified by unit & integration tests |
| Accounting integrity for Admin/Treasurer | Completed | `payments.amountPaise` correctly aggregates multi-ticket revenue |
