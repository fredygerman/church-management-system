"use server"

import { db, members, workspaces, workspaceUserRequests, workspaceUsers, count, eq } from "@church/db"

// Function to get all workspaces
export async function getWorkspaces() {
  return await db.select().from(workspaces).execute()
}

// Function to create a new workspace
export async function createWorkspace(data: {
  name: string
  imageUrl: string
  location: string
  createdBy: string | null
  updatedBy: string | null
}) {
  const createdWorkspace = await db
    .insert(workspaces)
    .values(data)
    .returning()
    .execute()

  // Add the creator to the workspaceUsers table
  if (createdWorkspace.length > 0 && data.createdBy) {
    await db
      .insert(workspaceUsers)
      .values({
        workspaceId: createdWorkspace[0].id,
        userId: data.createdBy,
      })
      .execute()
  }

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

export async function requestToJoinWorkspace(
  workspaceId: string,
  userId: string
) {
  const request = await db
    .insert(workspaceUserRequests)
    .values({
      workspaceId,
      userId,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // One week from now
    })
    .returning()
    .execute()
  return request
}
