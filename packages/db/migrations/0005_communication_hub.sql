CREATE TYPE "public"."communication_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'skipped');--> statement-breakpoint

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
);--> statement-breakpoint

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
);--> statement-breakpoint

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
);--> statement-breakpoint

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
);--> statement-breakpoint

CREATE TABLE "campaign_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "church_id" uuid NOT NULL,
  "event_type" varchar(100) NOT NULL,
  "details" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_recipient_id_campaign_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."campaign_recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "idx_message_templates_church" ON "message_templates" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_message_templates_channel" ON "message_templates" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_campaigns_church" ON "campaigns" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_scheduled_at" ON "campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_campaigns_channel" ON "campaigns" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_campaign_recipients_campaign" ON "campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_recipients_church" ON "campaign_recipients" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_recipients_status" ON "campaign_recipients" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_campaign_recipients_campaign_address" ON "campaign_recipients" USING btree ("campaign_id", "recipient_address");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_campaign" ON "message_deliveries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_recipient" ON "message_deliveries" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_church" ON "message_deliveries" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_message_deliveries_status" ON "message_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaign_events_campaign" ON "campaign_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_events_church" ON "campaign_events" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_events_type" ON "campaign_events" USING btree ("event_type");
