ALTER TABLE "attendance_risk_profiles" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attendance_risk_profiles" ALTER COLUMN "is_active" SET DATA TYPE boolean USING ("is_active" <> 0);--> statement-breakpoint
ALTER TABLE "attendance_risk_profiles" ALTER COLUMN "is_active" SET DEFAULT true;
