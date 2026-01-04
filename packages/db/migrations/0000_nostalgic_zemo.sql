CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"birth_date" date NOT NULL,
	"gender" varchar(6) NOT NULL,
	"marital_status" varchar(10) NOT NULL,
	"birth_place" varchar(255),
	"occupation" varchar(255),
	"salvation_date" date,
	"baptism_date" date,
	"anointed_date" date,
	"joined_date" date NOT NULL,
	"holy_spirit" boolean DEFAULT false,
	"tribe" varchar(255),
	"district" varchar(255),
	"ward" varchar(255),
	"street" varchar(255),
	"house_number" varchar(50),
	"phone" varchar(20),
	"number" varchar(9) NOT NULL,
	"zone_id" uuid,
	"landmark" varchar(255),
	"emergency_contact_1_name" varchar(255),
	"emergency_contact_1_relation" varchar(255),
	"emergency_contact_1_phone" varchar(20),
	"emergency_contact_1_address" varchar(255),
	"emergency_contact_2_name" varchar(255),
	"emergency_contact_2_relation" varchar(255),
	"emergency_contact_2_phone" varchar(20),
	"emergency_contact_2_address" varchar(255),
	"workspace_id" uuid NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	CONSTRAINT "members_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"picture" varchar(255),
	"role" "role" DEFAULT 'user',
	"is_active" boolean DEFAULT true,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspace_user_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"expires_at" date DEFAULT now() + interval '1 week' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_users" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image_url" varchar(255),
	"location" varchar(255) NOT NULL,
	"description" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"leader" varchar(255) NOT NULL,
	"description" text,
	"workspace_id" uuid NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"deleted_at" date
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;