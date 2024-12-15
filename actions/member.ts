"use server"

import { db } from "@/db"
import { members } from "@/db/tables/members"
import { workspaceMembers } from "@/db/tables/workspaceMembers"
import { and, count, eq, sql } from "drizzle-orm"

// Function to create a new member and add to workspace
export async function createMember(data: {
  fullName: string
  birthDate: string
  gender: "Male" | "Female"
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed"
  joinedDate: string
  workspaceId: string
}) {
  const createdMember = await db
    .insert(members)
    .values({
      fullName: data.fullName,
      birthDate: data.birthDate,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      joinedDate: data.joinedDate,
    })
    .returning()
    .execute()

  // Add member to workspace
  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: data.workspaceId,
      memberId: createdMember[0].id,
    })
    .execute()

  return createdMember
}

// Function to get all members in a workspace with pagination and filters
export async function getMembers(
  queryParams: {
    page: number
    per_page: number
    sort: string
    fullName: string
    gender: string
    maritalStatus: string
    occupation: string
    from: string
    to: string
  },
  workspaceId: string
): Promise<{ members: (typeof members.$inferSelect)[]; pageCount: number }> {
  const {
    page,
    per_page,
    sort,
    fullName,
    gender,
    maritalStatus,
    occupation,
    from,
    to,
  } = queryParams
  const offset = (page - 1) * per_page

  const filters = [
    eq(workspaceMembers.workspaceId, workspaceId),
    fullName
      ? sql`${members.fullName} ILIKE ${"%" + fullName + "%"}`
      : undefined,
    gender ? eq(members.gender, gender as "Male" | "Female") : undefined,
    maritalStatus
      ? eq(
          members.maritalStatus,
          maritalStatus as "Single" | "Married" | "Divorced" | "Widowed"
        )
      : undefined,
    occupation
      ? sql`${members.occupation} ILIKE ${"%" + occupation + "%"}`
      : undefined,
    from ? sql`${members.createdAt} >= ${from}` : undefined,
    to ? sql`${members.createdAt} <= ${to}` : undefined,
  ].filter(Boolean)

  const [memberList, totalCount] = await Promise.all([
    db
      .select()
      .from(members)
      .innerJoin(workspaceMembers, eq(members.id, workspaceMembers.memberId))
      .where(and(...filters))
      .orderBy(sql`${sort}`)
      .limit(per_page)
      .offset(offset)
      .execute(),
    countMembers(workspaceId),
  ])

  const pageCount = Math.ceil(totalCount / per_page)

  const membersOnly = memberList.map((item) => item.members)

  return { members: membersOnly, pageCount }
}

// Function to update a member
export async function updateMember(
  id: string,
  data: {
    fullName?: string
    birthDate?: string
    gender?: "Male" | "Female"
    maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed"
    joinedDate?: string
  }
) {
  const updatedMember = await db
    .update(members)
    .set(data)
    .where(eq(members.id, id))
    .returning()
    .execute()
  return updatedMember
}

// Function to delete a member
export async function deleteMember(id: string) {
  await db.delete(members).where(eq(members.id, id)).execute()
}

// Function to count members in a workspace
export async function countMembers(workspaceId: string) {
  const result = await db
    .select({ count: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .execute()
  return result[0].count
}
