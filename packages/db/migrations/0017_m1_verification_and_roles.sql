ALTER TYPE "public"."role" ADD VALUE 'usher';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'publisher';--> statement-breakpoint
CREATE TABLE "contact_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" varchar(8) NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"status" varchar(8) NOT NULL,
	"source" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ck_contact_consents_status" CHECK ("contact_consents"."status" in ('granted', 'revoked'))
);
--> statement-breakpoint
CREATE TABLE "contact_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" varchar(8) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"code_hmac" char(64) NOT NULL,
	"purpose" varchar(16) NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ck_contact_verifications_channel" CHECK ("contact_verifications"."channel" in ('email', 'phone')),
	CONSTRAINT "ck_contact_verifications_purpose" CHECK ("contact_verifications"."purpose" in ('signup', 'change', 'recovery'))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_e164" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_key" varchar(512);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_count" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "contact_consents" ADD CONSTRAINT "contact_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_verifications" ADD CONSTRAINT "contact_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contact_consents_user_channel_purpose" ON "contact_consents" USING btree ("user_id","channel","purpose","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_contact_verifications_user_channel" ON "contact_verifications" USING btree ("user_id","channel","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_e164_unique" UNIQUE("phone_e164");