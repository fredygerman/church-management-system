CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_zones" (
	"workspace_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_zones" ADD CONSTRAINT "workspace_zones_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_zones" ADD CONSTRAINT "workspace_zones_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;