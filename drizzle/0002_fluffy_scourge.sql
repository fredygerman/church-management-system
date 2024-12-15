CREATE TABLE "workspace_users" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "created_at" date DEFAULT now();--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;