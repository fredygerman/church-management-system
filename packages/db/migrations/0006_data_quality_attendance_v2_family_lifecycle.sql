CREATE TYPE "public"."import_job_status" AS ENUM('draft', 'previewed', 'committed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_mode" AS ENUM('create_only', 'update_only', 'create_and_update');--> statement-breakpoint
CREATE TYPE "public"."duplicate_candidate_status" AS ENUM('pending', 'approved', 'declined', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."service_cadence" AS ENUM('weekly', 'biweekly', 'monthly', 'special');--> statement-breakpoint
CREATE TYPE "public"."risk_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."relationship_role" AS ENUM('head', 'spouse', 'child', 'guardian', 'other');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('pending', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'approved', 'declined', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."milestone_type" AS ENUM('birthday', 'anniversary', 'baptism', 'custom');--> statement-breakpoint
CREATE TYPE "public"."milestone_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."milestone_notify_target" AS ENUM('member', 'family_head', 'leader', 'admin');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'notified', 'skipped');--> statement-breakpoint

CREATE TABLE "import_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "created_by" uuid,
  "file_name" varchar(255) NOT NULL,
  "file_format" varchar(20) NOT NULL,
  "column_mapping" text DEFAULT '{}' NOT NULL,
  "mode" "import_mode" DEFAULT 'create_and_update' NOT NULL,
  "status" "import_job_status" DEFAULT 'draft' NOT NULL,
  "idempotency_key" varchar(255),
  "total_rows" integer DEFAULT 0 NOT NULL,
  "valid_rows" integer DEFAULT 0 NOT NULL,
  "invalid_rows" integer DEFAULT 0 NOT NULL,
  "created_count" integer DEFAULT 0 NOT NULL,
  "updated_count" integer DEFAULT 0 NOT NULL,
  "skipped_count" integer DEFAULT 0 NOT NULL,
  "summary" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "import_rows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "import_job_id" uuid NOT NULL,
  "church_id" uuid NOT NULL,
  "row_number" integer NOT NULL,
  "raw_data" text NOT NULL,
  "normalized_data" text,
  "is_valid" boolean DEFAULT false NOT NULL,
  "errors" text DEFAULT '[]' NOT NULL,
  "action_taken" varchar(30),
  "target_member_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "duplicate_candidates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "primary_member_id" uuid NOT NULL,
  "duplicate_member_id" uuid NOT NULL,
  "confidence_score" integer DEFAULT 0 NOT NULL,
  "reason" text NOT NULL,
  "status" "duplicate_candidate_status" DEFAULT 'pending' NOT NULL,
  "created_by" uuid,
  "resolved_by" uuid,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "merge_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "candidate_id" uuid NOT NULL,
  "source_member_id" uuid NOT NULL,
  "target_member_id" uuid NOT NULL,
  "merged_by" uuid,
  "relink_summary" text DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "attendance_session_metadata" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "cadence" "service_cadence" DEFAULT 'weekly' NOT NULL,
  "tags" text DEFAULT '[]' NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "attendance_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "group_by" varchar(30) NOT NULL,
  "group_value" varchar(120) NOT NULL,
  "total_checkins" integer DEFAULT 0 NOT NULL,
  "unique_members" integer DEFAULT 0 NOT NULL,
  "session_count" integer DEFAULT 0 NOT NULL,
  "average_per_session" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "attendance_risk_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "version_label" varchar(60) DEFAULT 'v1' NOT NULL,
  "missed_weight" integer DEFAULT 70 NOT NULL,
  "recency_weight" integer DEFAULT 30 NOT NULL,
  "low_threshold" integer DEFAULT 30 NOT NULL,
  "medium_threshold" integer DEFAULT 60 NOT NULL,
  "high_threshold" integer DEFAULT 85 NOT NULL,
  "is_active" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "attendance_risk_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "profile_id" uuid,
  "risk_score" integer DEFAULT 0 NOT NULL,
  "severity" "risk_severity" DEFAULT 'low' NOT NULL,
  "effective_date" date NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "family_relationships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "family_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "role" "relationship_role" DEFAULT 'other' NOT NULL,
  "status" "connection_status" DEFAULT 'confirmed' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "family_connection_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "family_id" uuid,
  "member_id" uuid NOT NULL,
  "suggested_family_id" uuid,
  "reason" text NOT NULL,
  "status" "suggestion_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "resolved_at" timestamp
);--> statement-breakpoint

CREATE TABLE "milestone_notification_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "milestone_type" "milestone_type" NOT NULL,
  "custom_milestone_name" varchar(100),
  "channel" "milestone_channel" NOT NULL,
  "notify_target" "milestone_notify_target" NOT NULL,
  "lead_days" varchar(20) DEFAULT '0' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "lifecycle_milestones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "family_id" uuid,
  "milestone_type" "milestone_type" NOT NULL,
  "label" varchar(150) NOT NULL,
  "milestone_date" date NOT NULL,
  "status" "milestone_status" DEFAULT 'pending' NOT NULL,
  "notification_rule_id" uuid,
  "details" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id");--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_target_member_id_members_id_fk" FOREIGN KEY ("target_member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_primary_member_id_members_id_fk" FOREIGN KEY ("primary_member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_duplicate_member_id_members_id_fk" FOREIGN KEY ("duplicate_member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_candidate_id_duplicate_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."duplicate_candidates"("id");--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_source_member_id_members_id_fk" FOREIGN KEY ("source_member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_target_member_id_members_id_fk" FOREIGN KEY ("target_member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "attendance_session_metadata" ADD CONSTRAINT "attendance_session_metadata_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "attendance_session_metadata" ADD CONSTRAINT "attendance_session_metadata_session_id_service_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_sessions"("id");--> statement-breakpoint
ALTER TABLE "attendance_snapshots" ADD CONSTRAINT "attendance_snapshots_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "attendance_risk_profiles" ADD CONSTRAINT "attendance_risk_profiles_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "attendance_risk_history" ADD CONSTRAINT "attendance_risk_history_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "attendance_risk_history" ADD CONSTRAINT "attendance_risk_history_profile_id_attendance_risk_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."attendance_risk_profiles"("id");--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id");--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_suggested_family_id_families_id_fk" FOREIGN KEY ("suggested_family_id") REFERENCES "public"."families"("id");--> statement-breakpoint
ALTER TABLE "milestone_notification_rules" ADD CONSTRAINT "milestone_notification_rules_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id");--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id");--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_notification_rule_id_milestone_notification_rules_id_fk" FOREIGN KEY ("notification_rule_id") REFERENCES "public"."milestone_notification_rules"("id");--> statement-breakpoint

CREATE INDEX "idx_import_jobs_church" ON "import_jobs"("church_id");--> statement-breakpoint
CREATE INDEX "idx_duplicate_candidates_church" ON "duplicate_candidates"("church_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_snapshots_church" ON "attendance_snapshots"("church_id");--> statement-breakpoint
CREATE INDEX "idx_family_relationships_church" ON "family_relationships"("church_id");
