CREATE TABLE "giving_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
ALTER TABLE "offerings" ADD COLUMN "goal_id" uuid;--> statement-breakpoint
ALTER TABLE "offerings" ADD COLUMN "show_on_donor_wall" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "giving_goals" ADD CONSTRAINT "giving_goals_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_giving_goals_church" ON "giving_goals" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_giving_goals_end_date" ON "giving_goals" USING btree ("end_date");--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_goal_id_giving_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."giving_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_offerings_goal" ON "offerings" USING btree ("goal_id");