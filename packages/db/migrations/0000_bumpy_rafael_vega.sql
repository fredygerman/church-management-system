CREATE TYPE "public"."baptism_status" AS ENUM('none', 'maji', 'roho_mtakatifu', 'both');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."attendance_checkin_source" AS ENUM('qr', 'manual');--> statement-breakpoint
CREATE TYPE "public"."communication_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('pending', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."duplicate_candidate_status" AS ENUM('pending', 'approved', 'declined', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."import_job_status" AS ENUM('draft', 'previewed', 'committed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_mode" AS ENUM('create_only', 'update_only', 'create_and_update');--> statement-breakpoint
CREATE TYPE "public"."member_gender" AS ENUM('male', 'female', 'others');--> statement-breakpoint
CREATE TYPE "public"."member_marital_status" AS ENUM('single', 'married', 'divorced', 'widowed');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."milestone_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."milestone_notify_target" AS ENUM('member', 'family_head', 'leader', 'admin');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'notified', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."milestone_type" AS ENUM('birthday', 'anniversary', 'baptism', 'custom');--> statement-breakpoint
CREATE TYPE "public"."relationship_role" AS ENUM('head', 'spouse', 'child', 'guardian', 'other');--> statement-breakpoint
CREATE TYPE "public"."risk_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'admin', 'branch_admin', 'zone_leader', 'member');--> statement-breakpoint
CREATE TYPE "public"."service_cadence" AS ENUM('weekly', 'biweekly', 'monthly', 'special');--> statement-breakpoint
CREATE TYPE "public"."service_session_status" AS ENUM('draft', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'approved', 'declined', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."visitor_followup_status" AS ENUM('none', 'called', 'visited', 'converted', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."visitor_source" AS ENUM('friend', 'flyer', 'walk_in', 'event', 'referral', 'social_media', 'other');--> statement-breakpoint
CREATE TABLE "attendance_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"source" "attendance_checkin_source" DEFAULT 'manual' NOT NULL,
	"created_at" date DEFAULT now()
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "attendance_risk_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"profile_id" uuid,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"severity" "risk_severity" DEFAULT 'low' NOT NULL,
	"effective_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "attendance_session_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"cadence" "service_cadence" DEFAULT 'weekly' NOT NULL,
	"tags" text DEFAULT '[]' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "campaign_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid,
	"full_name" varchar(255) NOT NULL,
	"zone_name" varchar(255),
	"gender" varchar(20),
	"marital_status" varchar(30),
	"recipient_address" varchar(255) NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"skip_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"template_id" uuid,
	"name" varchar(255) NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"subject" varchar(255),
	"body" text NOT NULL,
	"audience_filters" text DEFAULT '{}' NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "churches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"lead_pastor_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"description" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "engagement_risk_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_name" varchar(100) NOT NULL,
	"consecutive_missed_threshold" integer DEFAULT 4 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "engagement_risk_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"consecutive_missed_count" integer DEFAULT 0 NOT NULL,
	"threshold_used" integer DEFAULT 4 NOT NULL,
	"last_session_date" date,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "engagement_risk_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"consecutive_missed_threshold" integer DEFAULT 4 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"family_name" varchar(255) NOT NULL,
	"spouse_id" uuid,
	"parent_id" uuid,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "member_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"is_leader" boolean DEFAULT false,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"date_of_birth" date,
	"gender" "member_gender",
	"occupation" varchar(255),
	"date_of_salvation" date,
	"baptism_status" "baptism_status" DEFAULT 'none',
	"marital_status" "member_marital_status",
	"family_id" uuid,
	"notes" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "merge_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"source_member_id" uuid NOT NULL,
	"target_member_id" uuid NOT NULL,
	"merged_by" uuid,
	"relink_summary" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"provider_message_id" varchar(255),
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"provider_response" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"subject" varchar(255),
	"body" text NOT NULL,
	"variables" text DEFAULT '[]' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"purpose" varchar(100) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"sender" varchar(255),
	"subject" text,
	"message" text NOT NULL,
	"preview" text,
	"show_in_app" boolean DEFAULT true,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"reference" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"response" text,
	"error" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "user_church_membership_role_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"previous_role" "role",
	"next_role" "role" NOT NULL,
	"changed_by" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_church_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid,
	"role" "role" DEFAULT 'member' NOT NULL,
	"assigned_zone_id" uuid,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"is_default_church" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"picture" varchar(255),
	"role" "role" DEFAULT 'member',
	"church_id" uuid,
	"assigned_zone_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "visitor_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" uuid NOT NULL,
	"status" "visitor_followup_status" DEFAULT 'none',
	"notes" text,
	"followup_date" date,
	"completed_by" uuid,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"visit_date" date DEFAULT now(),
	"visitor_source" "visitor_source" DEFAULT 'walk_in',
	"referred_by_member_id" uuid,
	"converted_to_member_id" uuid,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"leader_id" uuid,
	"meeting_day" varchar(50),
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
ALTER TABLE "attendance_checkins" ADD CONSTRAINT "attendance_checkins_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_checkins" ADD CONSTRAINT "attendance_checkins_session_id_service_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_checkins" ADD CONSTRAINT "attendance_checkins_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_headcounts" ADD CONSTRAINT "attendance_headcounts_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_headcounts" ADD CONSTRAINT "attendance_headcounts_session_id_service_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_risk_history" ADD CONSTRAINT "attendance_risk_history_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_risk_history" ADD CONSTRAINT "attendance_risk_history_profile_id_attendance_risk_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."attendance_risk_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_risk_profiles" ADD CONSTRAINT "attendance_risk_profiles_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_session_metadata" ADD CONSTRAINT "attendance_session_metadata_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_session_metadata" ADD CONSTRAINT "attendance_session_metadata_session_id_service_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_snapshots" ADD CONSTRAINT "attendance_snapshots_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_primary_member_id_members_id_fk" FOREIGN KEY ("primary_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_duplicate_member_id_members_id_fk" FOREIGN KEY ("duplicate_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_risk_flags" ADD CONSTRAINT "engagement_risk_flags_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_risk_flags" ADD CONSTRAINT "engagement_risk_flags_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_risk_settings" ADD CONSTRAINT "engagement_risk_settings_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_spouse_id_members_id_fk" FOREIGN KEY ("spouse_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_parent_id_members_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_suggested_family_id_families_id_fk" FOREIGN KEY ("suggested_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_target_member_id_members_id_fk" FOREIGN KEY ("target_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_notification_rule_id_milestone_notification_rules_id_fk" FOREIGN KEY ("notification_rule_id") REFERENCES "public"."milestone_notification_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_zones" ADD CONSTRAINT "member_zones_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_zones" ADD CONSTRAINT "member_zones_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_zones" ADD CONSTRAINT "member_zones_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_candidate_id_duplicate_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."duplicate_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_source_member_id_members_id_fk" FOREIGN KEY ("source_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_target_member_id_members_id_fk" FOREIGN KEY ("target_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_actions" ADD CONSTRAINT "merge_actions_merged_by_users_id_fk" FOREIGN KEY ("merged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_recipient_id_campaign_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."campaign_recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_notification_rules" ADD CONSTRAINT "milestone_notification_rules_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_membership_role_events" ADD CONSTRAINT "user_church_membership_role_events_membership_id_user_church_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."user_church_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_membership_role_events" ADD CONSTRAINT "user_church_membership_role_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_membership_role_events" ADD CONSTRAINT "user_church_membership_role_events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_membership_role_events" ADD CONSTRAINT "user_church_membership_role_events_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_memberships" ADD CONSTRAINT "user_church_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_memberships" ADD CONSTRAINT "user_church_memberships_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_memberships" ADD CONSTRAINT "user_church_memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_church_memberships" ADD CONSTRAINT "user_church_memberships_assigned_zone_id_zones_id_fk" FOREIGN KEY ("assigned_zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_followups" ADD CONSTRAINT "visitor_followups_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_referred_by_member_id_members_id_fk" FOREIGN KEY ("referred_by_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_converted_to_member_id_members_id_fk" FOREIGN KEY ("converted_to_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attendance_checkins_church" ON "attendance_checkins" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_checkins_session" ON "attendance_checkins" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_checkins_member" ON "attendance_checkins" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_attendance_checkins_session_member" ON "attendance_checkins" USING btree ("session_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_headcounts_church" ON "attendance_headcounts" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_attendance_headcounts_session" ON "attendance_headcounts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_events_campaign" ON "campaign_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_events_church" ON "campaign_events" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_events_type" ON "campaign_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_campaign_recipients_campaign" ON "campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_recipients_church" ON "campaign_recipients" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_recipients_status" ON "campaign_recipients" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_campaign_recipients_campaign_address" ON "campaign_recipients" USING btree ("campaign_id","recipient_address");--> statement-breakpoint
CREATE INDEX "idx_campaigns_church" ON "campaigns" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_scheduled_at" ON "campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_campaigns_channel" ON "campaigns" USING btree ("channel");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_campaigns_church_name_scheduled" ON "campaigns" USING btree ("church_id","name","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_churches_email" ON "churches" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_churches_phone" ON "churches" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_churches_name" ON "churches" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_engagement_risk_flags_church" ON "engagement_risk_flags" USING btree ("church_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_engagement_risk_flags_member" ON "engagement_risk_flags" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_engagement_risk_settings_church" ON "engagement_risk_settings" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_families_church" ON "families" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_families_spouse" ON "families" USING btree ("spouse_id");--> statement-breakpoint
CREATE INDEX "idx_families_parent" ON "families" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_import_jobs_church" ON "import_jobs" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_import_jobs_status" ON "import_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_import_jobs_idempotency" ON "import_jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_import_jobs_church_idempotency" ON "import_jobs" USING btree ("church_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_member_zone" ON "member_zones" USING btree ("member_id","zone_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_member_zone_church_member_zone" ON "member_zones" USING btree ("church_id","member_id","zone_id");--> statement-breakpoint
CREATE INDEX "idx_member_zones_member" ON "member_zones" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_zones_zone" ON "member_zones" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "idx_member_zones_church" ON "member_zones" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_members_church" ON "members" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_members_phone" ON "members" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_members_name" ON "members" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "idx_members_family" ON "members" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_campaign" ON "message_deliveries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_recipient" ON "message_deliveries" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_church" ON "message_deliveries" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_status" ON "message_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_message_templates_church" ON "message_templates" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_message_templates_channel" ON "message_templates" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_service_sessions_church" ON "service_sessions" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_service_sessions_date" ON "service_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "idx_service_sessions_status" ON "service_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_service_sessions_qr_token" ON "service_sessions" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "idx_service_types_church" ON "service_types" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_service_types_active" ON "service_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_church_membership_role_events_membership" ON "user_church_membership_role_events" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "idx_user_church_membership_role_events_user" ON "user_church_membership_role_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_church_membership_role_events_church" ON "user_church_membership_role_events" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_user_church_membership_role_events_changed_by" ON "user_church_membership_role_events" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "idx_user_church_memberships_user" ON "user_church_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_church_memberships_church" ON "user_church_memberships" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_user_church_memberships_member" ON "user_church_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_user_church_memberships_zone" ON "user_church_memberships" USING btree ("assigned_zone_id");--> statement-breakpoint
CREATE INDEX "idx_user_church_memberships_status" ON "user_church_memberships" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_church_memberships_active_user_church" ON "user_church_memberships" USING btree ("user_id","church_id") WHERE "user_church_memberships"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_church_memberships_default_user" ON "user_church_memberships" USING btree ("user_id") WHERE "user_church_memberships"."is_default_church" = true AND "user_church_memberships"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_phone" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_users_church" ON "users" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_zone" ON "users" USING btree ("assigned_zone_id");--> statement-breakpoint
CREATE INDEX "idx_followups_visitor" ON "visitor_followups" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "idx_followups_status" ON "visitor_followups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_followups_date" ON "visitor_followups" USING btree ("followup_date");--> statement-breakpoint
CREATE INDEX "idx_visitors_church" ON "visitors" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_visitors_phone" ON "visitors" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_visitors_email" ON "visitors" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_visitors_visit_date" ON "visitors" USING btree ("visit_date");--> statement-breakpoint
CREATE INDEX "idx_visitors_source" ON "visitors" USING btree ("visitor_source");--> statement-breakpoint
CREATE INDEX "idx_visitors_referred_by" ON "visitors" USING btree ("referred_by_member_id");--> statement-breakpoint
CREATE INDEX "idx_zones_church" ON "zones" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_zones_leader" ON "zones" USING btree ("leader_id");--> statement-breakpoint
CREATE INDEX "idx_zones_name" ON "zones" USING btree ("name");