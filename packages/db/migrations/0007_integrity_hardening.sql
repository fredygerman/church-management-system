-- Data integrity hardening:
-- 1) Cross-entity consistency for member_zones <-> members/zones/churches
-- 2) Idempotency protection for import jobs
-- 3) Campaign scheduling uniqueness guards

-- Ensure church_id exists on member_zones
ALTER TABLE "member_zones"
ADD COLUMN IF NOT EXISTS "church_id" uuid;

-- Backfill church_id from members first, then zones as fallback
UPDATE "member_zones" mz
SET "church_id" = m."church_id"
FROM "members" m
WHERE mz."member_id" = m."id"
  AND mz."church_id" IS NULL;

UPDATE "member_zones" mz
SET "church_id" = z."church_id"
FROM "zones" z
WHERE mz."zone_id" = z."id"
  AND mz."church_id" IS NULL;

-- Add supporting composite uniqueness for scoped foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ux_members_id_church'
  ) THEN
    ALTER TABLE "members"
    ADD CONSTRAINT "ux_members_id_church" UNIQUE ("id", "church_id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ux_zones_id_church'
  ) THEN
    ALTER TABLE "zones"
    ADD CONSTRAINT "ux_zones_id_church" UNIQUE ("id", "church_id");
  END IF;
END $$;

-- Enforce not-null and church FK on member_zones
ALTER TABLE "member_zones"
ALTER COLUMN "church_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_zones_church_id_churches_id_fk'
  ) THEN
    ALTER TABLE "member_zones"
    ADD CONSTRAINT "member_zones_church_id_churches_id_fk"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_zones_member_church_fk'
  ) THEN
    ALTER TABLE "member_zones"
    ADD CONSTRAINT "member_zones_member_church_fk"
    FOREIGN KEY ("member_id", "church_id")
    REFERENCES "members"("id", "church_id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'member_zones_zone_church_fk'
  ) THEN
    ALTER TABLE "member_zones"
    ADD CONSTRAINT "member_zones_zone_church_fk"
    FOREIGN KEY ("zone_id", "church_id")
    REFERENCES "zones"("id", "church_id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- Add targeted indexes and unique key for scoped membership mapping
CREATE INDEX IF NOT EXISTS "idx_member_zones_church"
ON "member_zones" ("church_id");

CREATE UNIQUE INDEX IF NOT EXISTS "ux_member_zone_church_member_zone"
ON "member_zones" ("church_id", "member_id", "zone_id");

-- Idempotency key protection per church
CREATE INDEX IF NOT EXISTS "idx_import_jobs_idempotency"
ON "import_jobs" ("idempotency_key");

CREATE UNIQUE INDEX IF NOT EXISTS "ux_import_jobs_church_idempotency_nonnull"
ON "import_jobs" ("church_id", "idempotency_key")
WHERE "idempotency_key" IS NOT NULL;

-- Campaign scheduling guards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaigns_scheduled_requires_timestamp'
  ) THEN
    ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_scheduled_requires_timestamp"
    CHECK ("status" <> 'scheduled'::campaign_status OR "scheduled_at" IS NOT NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "ux_campaigns_scheduled_church_name_time"
ON "campaigns" ("church_id", "name", "scheduled_at")
WHERE "status" = 'scheduled'::campaign_status
  AND "deleted_at" IS NULL
  AND "scheduled_at" IS NOT NULL;
