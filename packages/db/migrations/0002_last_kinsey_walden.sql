CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"meeting_day" varchar(50),
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "member_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"is_leader" boolean DEFAULT false,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_departments" ADD CONSTRAINT "member_departments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_departments" ADD CONSTRAINT "member_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_departments" ADD CONSTRAINT "member_departments_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_departments_church" ON "departments" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_departments_name" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_member_department" ON "member_departments" USING btree ("member_id","department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_member_department_church_member_department" ON "member_departments" USING btree ("church_id","member_id","department_id");--> statement-breakpoint
CREATE INDEX "idx_member_departments_member" ON "member_departments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_departments_department" ON "member_departments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_member_departments_church" ON "member_departments" USING btree ("church_id");