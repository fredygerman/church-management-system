ALTER TABLE "members" ADD COLUMN "number" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_number_unique" UNIQUE("number");