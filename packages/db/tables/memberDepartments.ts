import { sql } from "drizzle-orm"
import { boolean, date, pgTable, uuid, index, uniqueIndex } from "drizzle-orm/pg-core"

import { members } from "./members"
import { departments } from "./departments"
import { churches } from "./churches"

export const memberDepartments = pgTable(
  "member_departments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    memberId: uuid("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    departmentId: uuid("department_id")
      .references(() => departments.id, { onDelete: "cascade" })
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id, { onDelete: "cascade" })
      .notNull(),
    isLeader: boolean("is_leader").default(false),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    uniqueMemberDepartment: uniqueIndex("ux_member_department").on(table.memberId, table.departmentId),
    uniqueChurchMemberDepartment: uniqueIndex("ux_member_department_church_member_department").on(table.churchId, table.memberId, table.departmentId),
    memberIdx: index("idx_member_departments_member").on(table.memberId),
    departmentIdx: index("idx_member_departments_department").on(table.departmentId),
    churchIdx: index("idx_member_departments_church").on(table.churchId),
  })
)

export type MemberDepartment = typeof memberDepartments.$inferSelect
export type NewMemberDepartment = typeof memberDepartments.$inferInsert
