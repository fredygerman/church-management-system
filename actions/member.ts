"use server"

import { db } from "@/db"
import { members } from "@/db/tables/members"
import { isValid, parseISO } from "date-fns"
import { and, count, eq, sql } from "drizzle-orm"

import { type MemberFormData } from "@/types/member"
import { generateFriendlyMemberNumber } from "@/lib/utils"

function isValidDate(dateStr: string): boolean {
  try {
    return isValid(parseISO(dateStr))
  } catch {
    return false
  }
}

// Function to create a new member
export async function createMember(
  data: MemberFormData & { workspaceId: string }
): Promise<{ success: boolean; member: typeof members.$inferSelect }> {
  // Validate required dates
  if (
    !data.personalInfo.birthDate ||
    !isValidDate(data.personalInfo.birthDate)
  ) {
    throw new Error("Birth date is required and must be a valid date")
  }
  if (!data.churchInfo.joinedDate || !isValidDate(data.churchInfo.joinedDate)) {
    throw new Error("Joined date is required and must be a valid date")
  }

  // Validate optional dates if provided
  if (
    data.churchInfo.salvationDate &&
    !isValidDate(data.churchInfo.salvationDate)
  ) {
    throw new Error("Salvation date must be a valid date")
  }
  if (
    data.churchInfo.baptismDate &&
    !isValidDate(data.churchInfo.baptismDate)
  ) {
    throw new Error("Baptism date must be a valid date")
  }
  if (
    data.churchInfo.anointedDate &&
    !isValidDate(data.churchInfo.anointedDate)
  ) {
    throw new Error("Anointed date must be a valid date")
  }

  let memberNumber: string = ""
  let isUnique = false

  while (!isUnique) {
    memberNumber = generateFriendlyMemberNumber()
    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.number, memberNumber))
      .execute()

    if (existingMember.length === 0) {
      isUnique = true
    }
  }

  console.log("Member Number:", memberNumber)

  const createdMember = await db
    .insert(members)
    .values({
      ...data.personalInfo,
      ...data.churchInfo,
      workspaceId: data.workspaceId,
      number: memberNumber,
    })
    .returning()
    .execute()

  return {
    success: true,
    member: createdMember[0],
  }
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
    eq(members.workspaceId, workspaceId),
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
      .where(and(...filters))
      .orderBy(sql`${sort}`)
      .limit(per_page)
      .offset(offset)
      .execute(),
    countMembers(workspaceId),
  ])

  const pageCount = Math.ceil(totalCount / per_page)

  return { members: memberList, pageCount }
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
    .from(members)
    .where(eq(members.workspaceId, workspaceId))
    .execute()
  return result[0].count
}
