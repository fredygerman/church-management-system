CREATE TYPE "public"."announcement_status" AS ENUM('draft', 'pending_approval', 'scheduled', 'published', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."membership_status" ADD VALUE 'pending_approval';--> statement-breakpoint
CREATE TABLE "announcement_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"kind" varchar(8) NOT NULL,
	"content_type" varchar(64) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "announcement_attachments_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "announcement_attachments_kind_check" CHECK ("announcement_attachments"."kind" in ('image', 'file'))
);
--> statement-breakpoint
CREATE TABLE "announcement_settings" (
	"church_id" uuid PRIMARY KEY NOT NULL,
	"require_approval" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"summary" varchar(300),
	"body_format" varchar(16) DEFAULT 'doc_v1' NOT NULL,
	"body" jsonb NOT NULL,
	"channels" jsonb DEFAULT '["in_app"]'::jsonb NOT NULL,
	"audience" jsonb DEFAULT '{"allMembers":true}'::jsonb NOT NULL,
	"sms_body" varchar(459),
	"status" "announcement_status" DEFAULT 'draft' NOT NULL,
	"publish_idempotency_key" varchar(64),
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_announcements_body_format" CHECK ("announcements"."body_format" in ('plain', 'doc_v1')),
	CONSTRAINT "ck_announcements_title_not_empty" CHECK (char_length(btrim("announcements"."title")) > 0),
	CONSTRAINT "ck_announcements_channels" CHECK (jsonb_typeof("announcements"."channels") = 'array' and "announcements"."channels" @> '["in_app"]'::jsonb and "announcements"."channels" <@ '["in_app","email","sms"]'::jsonb),
	CONSTRAINT "ck_announcements_audience_object" CHECK (jsonb_typeof("announcements"."audience") = 'object'),
	CONSTRAINT "ck_announcements_status_timestamps" CHECK (("announcements"."status" <> 'scheduled' or "announcements"."scheduled_at" is not null)
        and ("announcements"."status" <> 'published' or "announcements"."published_at" is not null)
        and ("announcements"."status" <> 'cancelled' or "announcements"."cancelled_at" is not null)),
	CONSTRAINT "ck_announcements_approval" CHECK (("announcements"."approved_by" is null or "announcements"."approved_at" is not null)
        and ("announcements"."approved_by" is null or "announcements"."created_by" is null or "announcements"."approved_by" <> "announcements"."created_by"))
);
--> statement-breakpoint
CREATE TABLE "church_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"code_hash" char(64) NOT NULL,
	"last_chars" varchar(4) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"max_uses" integer NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"reference" varchar(120) NOT NULL,
	"text_en" text NOT NULL,
	"text_sw" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"date" date NOT NULL,
	"entry_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcement_attachments" ADD CONSTRAINT "announcement_attachments_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_attachments" ADD CONSTRAINT "announcement_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_settings" ADD CONSTRAINT "announcement_settings_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_settings" ADD CONSTRAINT "announcement_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_invitations" ADD CONSTRAINT "church_invitations_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_invitations" ADD CONSTRAINT "church_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_entries" ADD CONSTRAINT "verse_entries_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_overrides" ADD CONSTRAINT "verse_overrides_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_overrides" ADD CONSTRAINT "verse_overrides_entry_id_verse_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."verse_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_announcement_attachments_church" ON "announcement_attachments" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_announcements_church_status" ON "announcements" USING btree ("church_id","status");--> statement-breakpoint
CREATE INDEX "idx_announcements_church_published" ON "announcements" USING btree ("church_id","published_at");--> statement-breakpoint
CREATE INDEX "idx_announcements_church_created" ON "announcements" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_church_invitations_code_hash" ON "church_invitations" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "idx_church_invitations_church" ON "church_invitations" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_church_invitations_created_by" ON "church_invitations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_verse_entries_church_active" ON "verse_entries" USING btree ("church_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_verse_overrides_church_date" ON "verse_overrides" USING btree ("church_id","date");