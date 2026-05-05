import { relations } from "drizzle-orm"
import { members } from "./members"
import { zones } from "./zones"
import { memberZones } from "./memberZones"
import { churches } from "./churches"
import { families } from "./families"
import { visitors, visitorFollowups } from "./visitors"
import { users } from "./user"
import {
  serviceTypes,
  serviceSessions,
  attendanceHeadcounts,
  attendanceCheckins,
  engagementRiskSettings,
  engagementRiskFlags,
} from "./attendance"
import {
  messageTemplates,
  campaigns,
  campaignRecipients,
  messageDeliveries,
  campaignEvents,
} from "./communications"

// Church relations
export const churchesRelations = relations(churches, ({ many }) => ({
  zones: many(zones),
  members: many(members),
  families: many(families),
  visitors: many(visitors),
  users: many(users),
  serviceTypes: many(serviceTypes),
  serviceSessions: many(serviceSessions),
  attendanceHeadcounts: many(attendanceHeadcounts),
  attendanceCheckins: many(attendanceCheckins),
  engagementRiskSettings: many(engagementRiskSettings),
  engagementRiskFlags: many(engagementRiskFlags),
  messageTemplates: many(messageTemplates),
  campaigns: many(campaigns),
  campaignRecipients: many(campaignRecipients),
  messageDeliveries: many(messageDeliveries),
  campaignEvents: many(campaignEvents),
}))

// Zone relations
export const zonesRelations = relations(zones, ({ one, many }) => ({
  church: one(churches, {
    fields: [zones.churchId],
    references: [churches.id],
  }),
  leader: one(members, {
    fields: [zones.leaderId],
    references: [members.id],
  }),
  memberZones: many(memberZones),
}))

// Member relations
export const membersRelations = relations(members, ({ one, many }) => ({
  church: one(churches, {
    fields: [members.churchId],
    references: [churches.id],
  }),
  family: one(families, {
    fields: [members.familyId],
    references: [families.id],
  }),
  memberZones: many(memberZones),
  ledZones: many(zones),
  attendanceCheckins: many(attendanceCheckins),
  engagementRiskFlags: many(engagementRiskFlags),
  campaignRecipients: many(campaignRecipients),
}))

// MemberZone relations (junction table)
export const memberZonesRelations = relations(memberZones, ({ one }) => ({
  member: one(members, {
    fields: [memberZones.memberId],
    references: [members.id],
  }),
  zone: one(zones, {
    fields: [memberZones.zoneId],
    references: [zones.id],
  }),
}))

// Family relations
export const familiesRelations = relations(families, ({ one, many }) => ({
  church: one(churches, {
    fields: [families.churchId],
    references: [churches.id],
  }),
  members: many(members),
}))

// Visitor relations
export const visitorsRelations = relations(visitors, ({ one, many }) => ({
  church: one(churches, {
    fields: [visitors.churchId],
    references: [churches.id],
  }),
  referredByMember: one(members, {
    fields: [visitors.referredByMemberId],
    references: [members.id],
  }),
  convertedToMember: one(members, {
    fields: [visitors.convertedToMemberId],
    references: [members.id],
  }),
  followups: many(visitorFollowups),
}))

// Visitor Followup relations
export const visitorFollowupsRelations = relations(visitorFollowups, ({ one }) => ({
  visitor: one(visitors, {
    fields: [visitorFollowups.visitorId],
    references: [visitors.id],
  }),
  completedBy: one(users, {
    fields: [visitorFollowups.completedBy],
    references: [users.id],
  }),
}))

// User relations
export const usersRelations = relations(users, ({ one }) => ({
  church: one(churches, {
    fields: [users.churchId],
    references: [churches.id],
  }),
  assignedZone: one(zones, {
    fields: [users.assignedZoneId],
    references: [zones.id],
  }),
}))

export const messageTemplatesRelations = relations(messageTemplates, ({ one, many }) => ({
  church: one(churches, {
    fields: [messageTemplates.churchId],
    references: [churches.id],
  }),
  createdByUser: one(users, {
    fields: [messageTemplates.createdBy],
    references: [users.id],
  }),
  campaigns: many(campaigns),
}))

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  church: one(churches, {
    fields: [campaigns.churchId],
    references: [churches.id],
  }),
  template: one(messageTemplates, {
    fields: [campaigns.templateId],
    references: [messageTemplates.id],
  }),
  createdByUser: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  recipients: many(campaignRecipients),
  deliveries: many(messageDeliveries),
  events: many(campaignEvents),
}))

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignRecipients.campaignId],
    references: [campaigns.id],
  }),
  church: one(churches, {
    fields: [campaignRecipients.churchId],
    references: [churches.id],
  }),
  member: one(members, {
    fields: [campaignRecipients.memberId],
    references: [members.id],
  }),
  deliveries: many(messageDeliveries),
}))

export const messageDeliveriesRelations = relations(messageDeliveries, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [messageDeliveries.campaignId],
    references: [campaigns.id],
  }),
  recipient: one(campaignRecipients, {
    fields: [messageDeliveries.recipientId],
    references: [campaignRecipients.id],
  }),
  church: one(churches, {
    fields: [messageDeliveries.churchId],
    references: [churches.id],
  }),
}))

export const campaignEventsRelations = relations(campaignEvents, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignEvents.campaignId],
    references: [campaigns.id],
  }),
  church: one(churches, {
    fields: [campaignEvents.churchId],
    references: [churches.id],
  }),
}))

export const serviceTypesRelations = relations(serviceTypes, ({ one, many }) => ({
  church: one(churches, {
    fields: [serviceTypes.churchId],
    references: [churches.id],
  }),
  sessions: many(serviceSessions),
}))

export const serviceSessionsRelations = relations(serviceSessions, ({ one, many }) => ({
  church: one(churches, {
    fields: [serviceSessions.churchId],
    references: [churches.id],
  }),
  serviceType: one(serviceTypes, {
    fields: [serviceSessions.serviceTypeId],
    references: [serviceTypes.id],
  }),
  headcount: many(attendanceHeadcounts),
  checkins: many(attendanceCheckins),
}))

export const attendanceHeadcountsRelations = relations(attendanceHeadcounts, ({ one }) => ({
  church: one(churches, {
    fields: [attendanceHeadcounts.churchId],
    references: [churches.id],
  }),
  session: one(serviceSessions, {
    fields: [attendanceHeadcounts.sessionId],
    references: [serviceSessions.id],
  }),
}))

export const attendanceCheckinsRelations = relations(attendanceCheckins, ({ one }) => ({
  church: one(churches, {
    fields: [attendanceCheckins.churchId],
    references: [churches.id],
  }),
  session: one(serviceSessions, {
    fields: [attendanceCheckins.sessionId],
    references: [serviceSessions.id],
  }),
  member: one(members, {
    fields: [attendanceCheckins.memberId],
    references: [members.id],
  }),
}))

export const engagementRiskSettingsRelations = relations(engagementRiskSettings, ({ one }) => ({
  church: one(churches, {
    fields: [engagementRiskSettings.churchId],
    references: [churches.id],
  }),
}))

export const engagementRiskFlagsRelations = relations(engagementRiskFlags, ({ one }) => ({
  church: one(churches, {
    fields: [engagementRiskFlags.churchId],
    references: [churches.id],
  }),
  member: one(members, {
    fields: [engagementRiskFlags.memberId],
    references: [members.id],
  }),
}))
