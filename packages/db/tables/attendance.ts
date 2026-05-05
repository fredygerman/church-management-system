import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { churches } from "./churches"
import { members } from "./members"

export const serviceSessionStatusEnum = pgEnum("service_session_status", [
  "draft",
  "open",
  "closed",
])

export const checkinSourceEnum = pgEnum("attendance_checkin_source", [
  "qr",
  "manual",
])

export const serviceTypes = pgTable(
  "service_types",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id").references(() => churches.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_service_types_church").on(table.churchId),
    activeIdx: index("idx_service_types_active").on(table.isActive),
  })
)

export const serviceSessions = pgTable(
  "service_sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id").references(() => churches.id).notNull(),
    serviceTypeId: uuid("service_type_id").references(() => serviceTypes.id).notNull(),
    title: varchar("title", { length: 255 }),
    sessionDate: date("session_date").notNull(),
    status: serviceSessionStatusEnum("status").default("draft").notNull(),
    qrToken: varchar("qr_token", { length: 255 }).notNull(),
    openedAt: date("opened_at"),
    closedAt: date("closed_at"),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_service_sessions_church").on(table.churchId),
    dateIdx: index("idx_service_sessions_date").on(table.sessionDate),
    statusIdx: index("idx_service_sessions_status").on(table.status),
    tokenIdx: uniqueIndex("ux_service_sessions_qr_token").on(table.qrToken),
  })
)

export const attendanceHeadcounts = pgTable(
  "attendance_headcounts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id").references(() => churches.id).notNull(),
    sessionId: uuid("session_id").references(() => serviceSessions.id).notNull(),
    menCount: integer("men_count").default(0).notNull(),
    womenCount: integer("women_count").default(0).notNull(),
    childrenCount: integer("children_count").default(0).notNull(),
    visitorsCount: integer("visitors_count").default(0).notNull(),
    totalCount: integer("total_count").default(0).notNull(),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
  },
  (table) => ({
    churchIdx: index("idx_attendance_headcounts_church").on(table.churchId),
    sessionIdx: uniqueIndex("ux_attendance_headcounts_session").on(table.sessionId),
  })
)

export const attendanceCheckins = pgTable(
  "attendance_checkins",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id").references(() => churches.id).notNull(),
    sessionId: uuid("session_id").references(() => serviceSessions.id).notNull(),
    memberId: uuid("member_id").references(() => members.id).notNull(),
    source: checkinSourceEnum("source").default("manual").notNull(),
    createdAt: date("created_at").defaultNow(),
  },
  (table) => ({
    churchIdx: index("idx_attendance_checkins_church").on(table.churchId),
    sessionIdx: index("idx_attendance_checkins_session").on(table.sessionId),
    memberIdx: index("idx_attendance_checkins_member").on(table.memberId),
    uniqueCheckinIdx: uniqueIndex("ux_attendance_checkins_session_member").on(table.sessionId, table.memberId),
  })
)

export const engagementRiskDefaults = pgTable("engagement_risk_defaults", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  consecutiveMissedThreshold: integer("consecutive_missed_threshold").default(4).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
})

export const engagementRiskSettings = pgTable(
  "engagement_risk_settings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id").references(() => churches.id).notNull(),
    consecutiveMissedThreshold: integer("consecutive_missed_threshold").default(4).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
  },
  (table) => ({
    churchIdx: uniqueIndex("ux_engagement_risk_settings_church").on(table.churchId),
  })
)

export const engagementRiskFlags = pgTable(
  "engagement_risk_flags",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id").references(() => churches.id).notNull(),
    memberId: uuid("member_id").references(() => members.id).notNull(),
    consecutiveMissedCount: integer("consecutive_missed_count").default(0).notNull(),
    thresholdUsed: integer("threshold_used").default(4).notNull(),
    lastSessionDate: date("last_session_date"),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
  },
  (table) => ({
    churchIdx: index("idx_engagement_risk_flags_church").on(table.churchId),
    memberIdx: uniqueIndex("ux_engagement_risk_flags_member").on(table.memberId),
  })
)

export type ServiceType = typeof serviceTypes.$inferSelect
export type NewServiceType = typeof serviceTypes.$inferInsert
export type ServiceSession = typeof serviceSessions.$inferSelect
export type NewServiceSession = typeof serviceSessions.$inferInsert
export type AttendanceHeadcount = typeof attendanceHeadcounts.$inferSelect
export type NewAttendanceHeadcount = typeof attendanceHeadcounts.$inferInsert
export type AttendanceCheckin = typeof attendanceCheckins.$inferSelect
export type NewAttendanceCheckin = typeof attendanceCheckins.$inferInsert
export type EngagementRiskDefault = typeof engagementRiskDefaults.$inferSelect
export type NewEngagementRiskDefault = typeof engagementRiskDefaults.$inferInsert
export type EngagementRiskSetting = typeof engagementRiskSettings.$inferSelect
export type NewEngagementRiskSetting = typeof engagementRiskSettings.$inferInsert
export type EngagementRiskFlag = typeof engagementRiskFlags.$inferSelect
export type NewEngagementRiskFlag = typeof engagementRiskFlags.$inferInsert
