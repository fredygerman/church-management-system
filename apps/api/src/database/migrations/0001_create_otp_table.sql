-- Create OTP table for authentication verification
CREATE TABLE IF NOT EXISTS "otps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "code" varchar(6) NOT NULL,
  "purpose" varchar(50) NOT NULL,
  "is_used" boolean DEFAULT false NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "otps_user_id_idx" ON "otps" ("user_id");
CREATE INDEX IF NOT EXISTS "otps_code_idx" ON "otps" ("code");
CREATE INDEX IF NOT EXISTS "otps_expires_at_idx" ON "otps" ("expires_at");
CREATE INDEX IF NOT EXISTS "otps_purpose_idx" ON "otps" ("purpose");

-- Create composite index for OTP verification queries
CREATE INDEX IF NOT EXISTS "otps_user_purpose_idx" ON "otps" ("user_id", "purpose", "is_used", "expires_at");
