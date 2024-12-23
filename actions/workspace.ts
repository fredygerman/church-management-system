"use server"

import { db } from "@/db"
import { members } from "@/db/tables/members"
import { workspaces } from "@/db/tables/workspace"
import { count, eq } from "drizzle-orm"

// Function to get all workspaces
export async function getWorkspaces() {
  return await db.select().from(workspaces).execute()
}

// Function to create a new workspace
export async function createWorkspace(data: {
  name: string
  totalMembers: number
  imageUrl: string
  location: string
}) {
  const createdWorkspace = await db
    .insert(workspaces)
    .values(data)
    .returning()
    .execute()
  return createdWorkspace
}

// Function to get the count of members in a workspace
export async function getWorkspaceMembersCount(workspaceId: string) {
  const result = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.workspaceId, workspaceId))
    .execute()
  return result[0].count
}
