import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { churches } from './churches'
import { users } from './user'
import { members } from './members'

export const communicationChannelEnum = pgEnum('communication_channel', ['sms', 'email'])

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'sending',
  'completed',
  'failed',
  'cancelled',
])

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced',
  'skipped',
])

export const messageTemplates = pgTable(
  'message_templates',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid('church_id').references(() => churches.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    channel: communicationChannelEnum('channel').notNull(),
    subject: varchar('subject', { length: 255 }),
    body: text('body').notNull(),
    variables: text('variables').default('[]').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    churchIdx: index('idx_message_templates_church').on(table.churchId),
    channelIdx: index('idx_message_templates_channel').on(table.channel),
  })
)

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid('church_id').references(() => churches.id).notNull(),
    templateId: uuid('template_id').references(() => messageTemplates.id),
    name: varchar('name', { length: 255 }).notNull(),
    channel: communicationChannelEnum('channel').notNull(),
    subject: varchar('subject', { length: 255 }),
    body: text('body').notNull(),
    audienceFilters: text('audience_filters').default('{}').notNull(),
    status: campaignStatusEnum('status').default('draft').notNull(),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    churchIdx: index('idx_campaigns_church').on(table.churchId),
    statusIdx: index('idx_campaigns_status').on(table.status),
    scheduledIdx: index('idx_campaigns_scheduled_at').on(table.scheduledAt),
    channelIdx: index('idx_campaigns_channel').on(table.channel),
    uniqueScheduledCampaignPerChurchIdx: uniqueIndex('ux_campaigns_church_name_scheduled')
      .on(table.churchId, table.name, table.scheduledAt),
  })
)

export const campaignRecipients = pgTable(
  'campaign_recipients',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
    churchId: uuid('church_id').references(() => churches.id).notNull(),
    memberId: uuid('member_id').references(() => members.id),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    zoneName: varchar('zone_name', { length: 255 }),
    gender: varchar('gender', { length: 20 }),
    maritalStatus: varchar('marital_status', { length: 30 }),
    recipientAddress: varchar('recipient_address', { length: 255 }).notNull(),
    status: deliveryStatusEnum('status').default('pending').notNull(),
    skipReason: text('skip_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    campaignIdx: index('idx_campaign_recipients_campaign').on(table.campaignId),
    churchIdx: index('idx_campaign_recipients_church').on(table.churchId),
    statusIdx: index('idx_campaign_recipients_status').on(table.status),
    campaignAddressUniqueIdx: uniqueIndex('ux_campaign_recipients_campaign_address').on(table.campaignId, table.recipientAddress),
  })
)

export const messageDeliveries = pgTable(
  'message_deliveries',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
    recipientId: uuid('recipient_id').references(() => campaignRecipients.id).notNull(),
    churchId: uuid('church_id').references(() => churches.id).notNull(),
    channel: communicationChannelEnum('channel').notNull(),
    providerMessageId: varchar('provider_message_id', { length: 255 }),
    status: deliveryStatusEnum('status').default('pending').notNull(),
    failureReason: text('failure_reason'),
    providerResponse: text('provider_response'),
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    campaignIdx: index('idx_message_deliveries_campaign').on(table.campaignId),
    recipientIdx: index('idx_message_deliveries_recipient').on(table.recipientId),
    churchIdx: index('idx_message_deliveries_church').on(table.churchId),
    statusIdx: index('idx_message_deliveries_status').on(table.status),
  })
)

export const campaignEvents = pgTable(
  'campaign_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
    campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
    churchId: uuid('church_id').references(() => churches.id).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    details: text('details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    campaignIdx: index('idx_campaign_events_campaign').on(table.campaignId),
    churchIdx: index('idx_campaign_events_church').on(table.churchId),
    typeIdx: index('idx_campaign_events_type').on(table.eventType),
  })
)

export type MessageTemplate = typeof messageTemplates.$inferSelect
export type NewMessageTemplate = typeof messageTemplates.$inferInsert
export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
export type CampaignRecipient = typeof campaignRecipients.$inferSelect
export type NewCampaignRecipient = typeof campaignRecipients.$inferInsert
export type MessageDelivery = typeof messageDeliveries.$inferSelect
export type NewMessageDelivery = typeof messageDeliveries.$inferInsert
export type CampaignEvent = typeof campaignEvents.$inferSelect
export type NewCampaignEvent = typeof campaignEvents.$inferInsert
