CREATE TYPE "public"."prayer_request_status" AS ENUM('open', 'answered');--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"member_id" uuid,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" "prayer_request_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_prayer_requests_church" ON "prayer_requests" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_prayer_requests_member" ON "prayer_requests" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_prayer_requests_user" ON "prayer_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prayer_requests_status" ON "prayer_requests" USING btree ("status");