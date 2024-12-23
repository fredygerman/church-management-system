import { db } from "@/db"
import { workspaces } from "@/db/tables/workspace"
import { eq } from "drizzle-orm"

const hardCodedUUID = "f7b3b3b3-4b3b-4b3b-4b3b-4b3b3b3b3b3b"

export async function seedWorkspaces() {
  // Check if the workspace already exists
  const existingWorkspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, hardCodedUUID))
    .execute()

  if (existingWorkspace.length === 0) {
    // Create default workspace if it doesn't exist
    await db
      .insert(workspaces)
      .values({
        id: hardCodedUUID,
        name: "Test Church HQ",
        location: "123 Church St",
        imageUrl:
          "https://images.unsplash.com/photo-1519491050282-cf00c82424b4",
        description: "Default workspace for Test Church HQ",
      })
      .execute()
  }
}

export async function getFirstWorkspaceId() {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .limit(1)
  return workspace.id
}
