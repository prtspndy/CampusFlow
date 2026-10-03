-- Phase 04: merchandise catalogue, orders, and announcements.

CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "MerchOrderStatus" AS ENUM ('PLACED', 'CANCELLED');
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL_MEMBERS', 'VOLUNTEERS', 'EVENT_ATTENDEES');

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "memberPrice" INTEGER NOT NULL,
    "standardPrice" INTEGER NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "merch_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MerchOrderStatus" NOT NULL DEFAULT 'PLACED',
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "idempotencyKey" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "merch_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "merch_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    CONSTRAINT "merch_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL_MEMBERS',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_status_idx" ON "products"("status");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE UNIQUE INDEX "product_variants_productId_size_key" ON "product_variants"("productId", "size");
CREATE UNIQUE INDEX "merch_orders_orderNumber_key" ON "merch_orders"("orderNumber");
CREATE UNIQUE INDEX "merch_orders_idempotencyKey_key" ON "merch_orders"("idempotencyKey");
CREATE INDEX "merch_orders_userId_createdAt_idx" ON "merch_orders"("userId", "createdAt");
CREATE INDEX "merch_orders_status_idx" ON "merch_orders"("status");
CREATE INDEX "merch_order_items_orderId_idx" ON "merch_order_items"("orderId");
CREATE INDEX "merch_order_items_productId_idx" ON "merch_order_items"("productId");
CREATE INDEX "announcements_status_publishedAt_idx" ON "announcements"("status", "publishedAt");
CREATE INDEX "announcements_authorId_idx" ON "announcements"("authorId");

ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_stock_nonnegative" CHECK ("stock" >= 0);
ALTER TABLE "merch_order_items" ADD CONSTRAINT "merch_order_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "merch_orders" ADD CONSTRAINT "merch_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "merch_order_items" ADD CONSTRAINT "merch_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "merch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "merch_order_items" ADD CONSTRAINT "merch_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
