CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"purpose" varchar(100) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"sender" varchar(255),
	"subject" text,
	"message" text NOT NULL,
	"preview" text,
	"show_in_app" boolean DEFAULT true,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"reference" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"response" text,
	"error" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;