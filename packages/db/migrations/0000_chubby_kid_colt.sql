CREATE TYPE "public"."baptism_status" AS ENUM ('none', 'maji', 'roho_mtakatifu', 'both');
--> statement-breakpoint
CREATE TYPE "public"."member_gender" AS ENUM ('male', 'female', 'others');
--> statement-breakpoint
CREATE TYPE "public"."member_marital_status" AS ENUM ('single', 'married', 'divorced', 'widowed');
--> statement-breakpoint
CREATE TYPE "public"."visitor_followup_status" AS ENUM ('none', 'visited', 'called', 'prayed');
--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM ('super_admin', 'admin', 'branch_admin', 'zone_leader', 'member');
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
CREATE TABLE "member_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
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
	"date_of_birth" date NOT NULL,
	"gender" "member_gender" NOT NULL,
	"occupation" varchar(255),
	"date_of_salvation" date,
	"baptism_status" "baptism_status" DEFAULT 'none',
	"marital_status" "member_marital_status" NOT NULL,
	"family_id" uuid,
	"notes" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
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
ALTER TABLE "families" ADD CONSTRAINT "families_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_spouse_id_members_id_fk" FOREIGN KEY ("spouse_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_parent_id_members_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_zones" ADD CONSTRAINT "member_zones_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_zones" ADD CONSTRAINT "member_zones_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_followups" ADD CONSTRAINT "visitor_followups_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_churches_email" ON "churches" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_churches_phone" ON "churches" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_churches_name" ON "churches" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_families_church" ON "families" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_families_spouse" ON "families" USING btree ("spouse_id");--> statement-breakpoint
CREATE INDEX "idx_families_parent" ON "families" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_member_zone" ON "member_zones" USING btree ("member_id","zone_id");--> statement-breakpoint
CREATE INDEX "idx_member_zones_member" ON "member_zones" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_zones_zone" ON "member_zones" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "idx_members_church" ON "members" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_members_phone" ON "members" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_members_name" ON "members" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "idx_members_family" ON "members" USING btree ("family_id");--> statement-breakpoint
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
CREATE INDEX "idx_zones_church" ON "zones" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_zones_leader" ON "zones" USING btree ("leader_id");--> statement-breakpoint
CREATE INDEX "idx_zones_name" ON "zones" USING btree ("name");