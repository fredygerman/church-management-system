-- Phase 1: Digital Shepherd - Church Management Tables

-- Create churches table if it doesn't exist
CREATE TABLE IF NOT EXISTS "churches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"lead_pastor_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"description" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	CONSTRAINT "churches_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
);

-- Update zones table to reference churches instead of workspace
ALTER TABLE "zones" ADD COLUMN IF NOT EXISTS "church_id" uuid;
ALTER TABLE "zones" ADD CONSTRAINT "zones_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");
ALTER TABLE "zones" DROP COLUMN IF EXISTS "leader";
ALTER TABLE "zones" DROP COLUMN IF EXISTS "workspace_id";

-- Update members table to add church_id and new Phase 1 fields
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "church_id" uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "members" ADD CONSTRAINT "members_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");

-- Rename/update members table fields to match Phase 1 schema
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "first_name" varchar(255);
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "last_name" varchar(255);
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "date_of_birth" date;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "date_of_salvation" date;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "baptism_status" varchar(20) DEFAULT 'none';
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "marital_status" varchar(20);
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "jumuiya_id" uuid;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "family_id" uuid;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "notes" text;

-- Populate first_name and last_name from full_name if they exist
UPDATE "members" 
SET "first_name" = COALESCE("first_name", split_part("full_name", ' ', 1)),
    "last_name" = COALESCE("last_name", split_part("full_name", ' ', 2))
WHERE "full_name" IS NOT NULL AND "first_name" IS NULL;

-- Update date_of_birth from birth_date if exists
UPDATE "members"
SET "date_of_birth" = COALESCE("date_of_birth", "birth_date")
WHERE "birth_date" IS NOT NULL AND "date_of_birth" IS NULL;

-- Update date_of_salvation from salvation_date if exists
UPDATE "members"
SET "date_of_salvation" = COALESCE("date_of_salvation", "salvation_date")
WHERE "salvation_date" IS NOT NULL AND "date_of_salvation" IS NULL;

-- Create families table
CREATE TABLE IF NOT EXISTS "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"family_name" varchar(255) NOT NULL,
	"spouse_id" uuid REFERENCES "public"."members"("id"),
	"parent_id" uuid REFERENCES "public"."members"("id"),
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	CONSTRAINT "families_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id")
);

-- Create visitors (Wageni) table
CREATE TABLE IF NOT EXISTS "visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"visit_date" date DEFAULT now(),
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	CONSTRAINT "visitors_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id")
);

-- Create visitor followups table
CREATE TABLE IF NOT EXISTS "visitor_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'none',
	"notes" text,
	"followup_date" date,
	"completed_by" uuid,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	CONSTRAINT "visitor_followups_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_churches_workspace_id" ON "churches"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_zones_church_id" ON "zones"("church_id");
CREATE INDEX IF NOT EXISTS "idx_members_church_id" ON "members"("church_id");
CREATE INDEX IF NOT EXISTS "idx_members_jumuiya_id" ON "members"("jumuiya_id");
CREATE INDEX IF NOT EXISTS "idx_members_family_id" ON "members"("family_id");
CREATE INDEX IF NOT EXISTS "idx_families_church_id" ON "families"("church_id");
CREATE INDEX IF NOT EXISTS "idx_visitors_church_id" ON "visitors"("church_id");
CREATE INDEX IF NOT EXISTS "idx_visitor_followups_visitor_id" ON "visitor_followups"("visitor_id");
