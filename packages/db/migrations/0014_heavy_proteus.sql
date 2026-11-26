CREATE TYPE "public"."document_publication_status" AS ENUM('draft', 'review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."document_scope" AS ENUM('branch', 'network');--> statement-breakpoint
CREATE TABLE "document_publication_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"from_status" "document_publication_status",
	"to_status" "document_publication_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"church_id" uuid,
	"type" varchar(80) NOT NULL,
	"template_key" varchar(160) NOT NULL,
	"template_data" jsonb,
	"target_type" varchar(80),
	"target_params" jsonb,
	"source_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "networks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "networks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "public_church_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"public_id" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255),
	"contact_phone" varchar(20),
	"contact_email" varchar(255),
	"about" text,
	"image_url" varchar(2048),
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "public_church_profiles_church_id_unique" UNIQUE("church_id"),
	CONSTRAINT "public_church_profiles_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "resource_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"page_number" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "network_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "network_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "scope" "document_scope" DEFAULT 'branch' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "publication_status" "document_publication_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "resource_type" varchar(50) DEFAULT 'document' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "language" varchar(16);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "author_speaker" varchar(255);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "categories" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "cover_storage_key" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "page_count" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "transcript_storage_key" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "published_by" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "public_published_at" timestamp;--> statement-breakpoint
ALTER TABLE "document_publication_events" ADD CONSTRAINT "document_publication_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_publication_events" ADD CONSTRAINT "document_publication_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_notifications" ADD CONSTRAINT "inbox_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_notifications" ADD CONSTRAINT "inbox_notifications_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_church_profiles" ADD CONSTRAINT "public_church_profiles_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_progress" ADD CONSTRAINT "resource_progress_resource_id_documents_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_progress" ADD CONSTRAINT "resource_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_document_publication_events_document" ON "document_publication_events" USING btree ("document_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inbox_notifications_user_created" ON "inbox_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inbox_notifications_user_read" ON "inbox_notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "idx_inbox_notifications_church" ON "inbox_notifications" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "idx_networks_active" ON "networks" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_public_church_profiles_published" ON "public_church_profiles" USING btree ("published_at","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_resource_progress_resource_user" ON "resource_progress" USING btree ("resource_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_resource_progress_user" ON "resource_progress" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "churches" ADD CONSTRAINT "churches_network_id_networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_network_id_networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_churches_network" ON "churches" USING btree ("network_id");--> statement-breakpoint
CREATE INDEX "idx_documents_scope_publication" ON "documents" USING btree ("scope","publication_status","network_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_events_public" ON "events" USING btree ("church_id","public_published_at","starts_at");