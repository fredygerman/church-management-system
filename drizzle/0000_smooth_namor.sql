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
	"zone_id" uuid,
	"landmark" varchar(255),
	"emergency_contact_1_name" varchar(255),
	"emergency_contact_1_relation" varchar(255),
	"emergency_contact_1_phone" varchar(20),
	"emergency_contact_1_address" varchar(255),
	"emergency_contact_2_name" varchar(255),
	"emergency_contact_2_relation" varchar(255),
	"emergency_contact_2_phone" varchar(20),
	"emergency_contact_2_address" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image_url" varchar(255),
	"location" varchar(255) NOT NULL,
	"description" text,
	"created_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"leader" varchar(255) NOT NULL,
	"description" text,
	"created_at" date DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;