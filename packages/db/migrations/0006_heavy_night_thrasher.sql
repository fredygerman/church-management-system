ALTER TABLE "campaign_events" DROP CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_events" DROP CONSTRAINT "campaign_events_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_recipients" DROP CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_recipients" DROP CONSTRAINT "campaign_recipients_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_recipients" DROP CONSTRAINT "campaign_recipients_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_template_id_message_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" DROP CONSTRAINT "family_connection_suggestions_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" DROP CONSTRAINT "family_connection_suggestions_family_id_families_id_fk";
--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" DROP CONSTRAINT "family_connection_suggestions_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" DROP CONSTRAINT "family_connection_suggestions_suggested_family_id_families_id_fk";
--> statement-breakpoint
ALTER TABLE "family_relationships" DROP CONSTRAINT "family_relationships_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "family_relationships" DROP CONSTRAINT "family_relationships_family_id_families_id_fk";
--> statement-breakpoint
ALTER TABLE "family_relationships" DROP CONSTRAINT "family_relationships_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "family_relationships" DROP CONSTRAINT "family_relationships_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" DROP CONSTRAINT "lifecycle_milestones_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" DROP CONSTRAINT "lifecycle_milestones_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" DROP CONSTRAINT "lifecycle_milestones_family_id_families_id_fk";
--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" DROP CONSTRAINT "lifecycle_milestones_notification_rule_id_milestone_notification_rules_id_fk";
--> statement-breakpoint
ALTER TABLE "message_deliveries" DROP CONSTRAINT "message_deliveries_campaign_id_campaigns_id_fk";
--> statement-breakpoint
ALTER TABLE "message_deliveries" DROP CONSTRAINT "message_deliveries_recipient_id_campaign_recipients_id_fk";
--> statement-breakpoint
ALTER TABLE "message_deliveries" DROP CONSTRAINT "message_deliveries_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "message_templates" DROP CONSTRAINT "message_templates_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "message_templates" DROP CONSTRAINT "message_templates_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "milestone_notification_rules" DROP CONSTRAINT "milestone_notification_rules_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "visitor_followups" DROP CONSTRAINT "visitor_followups_visitor_id_visitors_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_connection_suggestions" ADD CONSTRAINT "family_connection_suggestions_suggested_family_id_families_id_fk" FOREIGN KEY ("suggested_family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_milestones" ADD CONSTRAINT "lifecycle_milestones_notification_rule_id_milestone_notification_rules_id_fk" FOREIGN KEY ("notification_rule_id") REFERENCES "public"."milestone_notification_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_recipient_id_campaign_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."campaign_recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_notification_rules" ADD CONSTRAINT "milestone_notification_rules_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_followups" ADD CONSTRAINT "visitor_followups_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;