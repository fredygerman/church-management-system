CREATE TABLE "offering_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"member_id" uuid,
	"session_id" uuid,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"offering_date" date NOT NULL,
	"note" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
ALTER TABLE "offering_categories" ADD CONSTRAINT "offering_categories_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_category_id_offering_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."offering_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_session_id_service_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."service_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_offering_categories_church" ON "offering_categories" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_offering_categories_name" ON "offering_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_offerings_church" ON "offerings" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_category" ON "offerings" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_member" ON "offerings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_session" ON "offerings" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_date" ON "offerings" USING btree ("offering_date");