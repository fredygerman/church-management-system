CREATE TABLE "oauth_provider_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_subject" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_recovery_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_provider_identities" ADD CONSTRAINT "oauth_provider_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_recovery_tokens" ADD CONSTRAINT "password_recovery_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_oauth_provider_identities_user" ON "oauth_provider_identities" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_oauth_provider_identities_provider_subject" ON "oauth_provider_identities" USING btree ("provider","provider_subject");--> statement-breakpoint
CREATE INDEX "idx_password_recovery_tokens_user" ON "password_recovery_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_recovery_tokens_expiry" ON "password_recovery_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_password_recovery_tokens_hash" ON "password_recovery_tokens" USING btree ("token_hash");