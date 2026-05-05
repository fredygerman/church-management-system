CREATE TYPE "public"."service_session_status" AS ENUM('draft', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."attendance_checkin_source" AS ENUM('qr', 'manual');--> statement-breakpoint

CREATE TABLE "service_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" date DEFAULT now(),
  "updated_at" date DEFAULT now(),
  "deleted_at" date
);--> statement-breakpoint

CREATE TABLE "service_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "service_type_id" uuid NOT NULL,
  "title" varchar(255),
  "session_date" date NOT NULL,
  "status" "service_session_status" DEFAULT 'draft' NOT NULL,
  "qr_token" varchar(255) NOT NULL,
  "opened_at" date,
  "closed_at" date,
  "created_at" date DEFAULT now(),
  "updated_at" date DEFAULT now(),
  "deleted_at" date
);--> statement-breakpoint

CREATE TABLE "attendance_headcounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "men_count" integer DEFAULT 0 NOT NULL,
  "women_count" integer DEFAULT 0 NOT NULL,
  "children_count" integer DEFAULT 0 NOT NULL,
  "visitors_count" integer DEFAULT 0 NOT NULL,
  "total_count" integer DEFAULT 0 NOT NULL,
  "created_at" date DEFAULT now(),
  "updated_at" date DEFAULT now()
);--> statement-breakpoint

CREATE TABLE "attendance_checkins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "source" "attendance_checkin_source" DEFAULT 'manual' NOT NULL,
  "created_at" date DEFAULT now()
);--> statement-breakpoint

CREATE TABLE "engagement_risk_defaults" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rule_name" varchar(100) NOT NULL,
  "consecutive_missed_threshold" integer DEFAULT 4 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" date DEFAULT now(),
  "updated_at" date DEFAULT now()
);--> statement-breakpoint

CREATE TABLE "engagement_risk_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "consecutive_missed_threshold" integer DEFAULT 4 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" date DEFAULT now(),
  "updated_at" date DEFAULT now()
);--> statement-breakpoint

CREATE TABLE "engagement_risk_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "consecutive_missed_count" integer DEFAULT 0 NOT NULL,
  "threshold_used" integer DEFAULT 4 NOT NULL,
  "last_session_date" date,
  "created_at" date DEFAULT now(),
  "updated_at" date DEFAULT now()
);--> statement-breakpoint

ALTER TABLE "service_types" ADD CONSTRAINT "service_types_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_headcounts" ADD CONSTRAINT "attendance_headcounts_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_headcounts" ADD CONSTRAINT "attendance_headcounts_session_id_service_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_checkins" ADD CONSTRAINT "attendance_checkins_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_checkins" ADD CONSTRAINT "attendance_checkins_session_id_service_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_checkins" ADD CONSTRAINT "attendance_checkins_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_risk_settings" ADD CONSTRAINT "engagement_risk_settings_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_risk_flags" ADD CONSTRAINT "engagement_risk_flags_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_risk_flags" ADD CONSTRAINT "engagement_risk_flags_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "idx_service_types_church" ON "service_types" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_service_types_active" ON "service_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_service_sessions_church" ON "service_sessions" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_service_sessions_date" ON "service_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "idx_service_sessions_status" ON "service_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_service_sessions_qr_token" ON "service_sessions" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "idx_attendance_headcounts_church" ON "attendance_headcounts" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_attendance_headcounts_session" ON "attendance_headcounts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_checkins_church" ON "attendance_checkins" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_checkins_session" ON "attendance_checkins" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_checkins_member" ON "attendance_checkins" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_attendance_checkins_session_member" ON "attendance_checkins" USING btree ("session_id", "member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_engagement_risk_settings_church" ON "engagement_risk_settings" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_engagement_risk_flags_church" ON "engagement_risk_flags" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_engagement_risk_flags_member" ON "engagement_risk_flags" USING btree ("member_id");
