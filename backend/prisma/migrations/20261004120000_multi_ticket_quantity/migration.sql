-- AlterTable
ALTER TABLE "event_registrations" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX IF EXISTS "tickets_registrationId_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tickets_registrationId_idx" ON "tickets"("registrationId");
