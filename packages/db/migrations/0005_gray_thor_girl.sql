CREATE TYPE "public"."event_rsvp_status" AS ENUM('going', 'maybe', 'declined');--> statement-breakpoint
CREATE TYPE "public"."event_scope" AS ENUM('church', 'network');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"status" "event_rsvp_status" NOT NULL,
	"attended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(255),
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"scope" "event_scope" DEFAULT 'church' NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"headcount" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_event_rsvps_event_member" ON "event_rsvps" USING btree ("event_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_event_rsvps_event" ON "event_rsvps" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_rsvps_member" ON "event_rsvps" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_event_rsvps_church" ON "event_rsvps" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_events_church" ON "events" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_events_starts_at" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "idx_events_status" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_events_scope_status" ON "events" USING btree ("scope","status");