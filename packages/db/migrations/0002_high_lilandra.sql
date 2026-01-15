CREATE TYPE "visitor_source" AS enum('friend', 'flyer', 'walk_in', 'event', 'referral', 'social_media', 'other');--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "visitor_source" "visitor_source" DEFAULT 'walk_in';--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "referred_by_member_id" uuid;--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "converted_to_member_id" uuid;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_referred_by_member_id_members_id_fk" FOREIGN KEY ("referred_by_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_converted_to_member_id_members_id_fk" FOREIGN KEY ("converted_to_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_visitors_source" ON "visitors" USING btree ("visitor_source");--> statement-breakpoint
CREATE INDEX "idx_visitors_referred_by" ON "visitors" USING btree ("referred_by_member_id");