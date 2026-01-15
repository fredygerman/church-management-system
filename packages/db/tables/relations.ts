import { relations } from "drizzle-orm"
import { members } from "./members"
import { zones } from "./zones"
import { memberZones } from "./memberZones"
import { churches } from "./churches"
import { families } from "./families"
import { visitors, visitorFollowups } from "./visitors"
import { users } from "./user"

// Church relations
export const churchesRelations = relations(churches, ({ many }) => ({
  zones: many(zones),
  members: many(members),
  families: many(families),
  visitors: many(visitors),
  users: many(users),
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
