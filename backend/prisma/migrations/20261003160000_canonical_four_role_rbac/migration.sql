-- Safe migration to canonical 4 roles: ADMIN, MEMBER, EVENT_MANAGER, TREASURER
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole_new') THEN
    CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MEMBER', 'EVENT_MANAGER', 'TREASURER');
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'admin' THEN 'ADMIN'::"UserRole_new"
    WHEN 'treasurer' THEN 'TREASURER'::"UserRole_new"
    WHEN 'volunteer' THEN 'EVENT_MANAGER'::"UserRole_new"
    WHEN 'door_staff' THEN 'EVENT_MANAGER'::"UserRole_new"
    WHEN 'ADMIN' THEN 'ADMIN'::"UserRole_new"
    WHEN 'TREASURER' THEN 'TREASURER'::"UserRole_new"
    WHEN 'EVENT_MANAGER' THEN 'EVENT_MANAGER'::"UserRole_new"
    ELSE 'MEMBER'::"UserRole_new"
  END
);
DROP TYPE IF EXISTS "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"UserRole";
