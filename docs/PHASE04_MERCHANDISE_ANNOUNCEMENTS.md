# Phase 04 — Merchandise and announcements

Merchandise prices are whole INR rupees, the same unit as event prices. An active membership receives `memberPrice`. Orders are club pickup reservations: the server decrements size stock when the order is placed and does not call Razorpay. Cancelling a `PLACED` order puts that stock back once. If a size row cannot be restored, the cancellation is rolled back and the API returns **409** `STOCK_RESTORE_FAILED`.

Inventory for purchases uses a conditional update (`stock >= quantity`) inside one database transaction. Several lines for the same product and size are reserved together, using the summed quantity. A multi-item order that cannot fill every line leaves stock and orders unchanged. Repeating `idempotencyKey` returns the existing order with **200** and does not decrement stock again. The stored key is `userId:idempotencyKey`, so one member cannot replay another member's key. If the generated order number collides, the server retries with a new number. The failed attempt rolls back, so stock is taken only once.

Announcements are created as drafts. Only `announcements.publish` (ADMIN) can publish or unpublish them. Publish succeeds only while the row is still `DRAFT` and sets `publishedAt`. Unpublish succeeds only while the row is still `PUBLISHED`, returns it to `DRAFT`, and clears `publishedAt`. The public list and detail endpoints return published rows. A draft id returns 404 to everyone else.

Apply the migration from `backend/`:

```bash
npx prisma migrate deploy
```

Migration name: `20261003220000_phase04_merchandise_and_announcements`.

An admin stock save sends the quantity loaded on screen as `expectedStock`. PostgreSQL updates the row only when that quantity is still current. If a purchase changed it, the API returns **409** `STOCK_CONFLICT` and the screen reloads. A purchase is never replaced by a stale absolute quantity.

## Isolated PostgreSQL tests

These tests are not part of `npm test`. They refuse any database URL that is not on localhost.

```bash
export PHASE4_TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54329/campusflow_phase4"
DATABASE_URL="$PHASE4_TEST_DATABASE_URL" DIRECT_URL="$PHASE4_TEST_DATABASE_URL" npx prisma migrate deploy
PHASE4_TEST_DATABASE_URL="$PHASE4_TEST_DATABASE_URL" npm run test:postgres
```

Do not point this URL at the shared Neon database.

## Browser walkthrough

Start the backend with a migrated database and the frontend dev server. These steps were not executed in the implementation session.

1. Sign in as an admin. Open `/admin/shop`. Create a product with stock 10. It appears in the list.
2. Change one size and save. The notice says the stock was saved. Set the product inactive and confirm `/shop` no longer lists it. Activate it again with a patch if you need it purchasable.
3. Sign in as a member. Open `/shop` and a product. Add a size to the cart and place the pickup order. The cart shows the order number. Open `/member/orders` and confirm the snapshotted price.
4. As admin, load stock, then in another session buy units, then save the old quantity. The page shows a conflict and reloads the lower stock.
5. As admin, open `/admin/announcements`, write a title and body, and send it. An admin publish makes it appear at `/announcements`. Open the detail link.
6. As a member, `POST /api/announcements` and `POST /api/products` return 403. A draft id opened while signed out returns the unavailable state.

Automated tests use the in-memory Prisma double, which serializes transactions. `tests/phase4.postgres.test.ts` is the PostgreSQL check and stays skipped until the command above is run.
