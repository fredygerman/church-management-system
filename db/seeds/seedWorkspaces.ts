import { db } from "@/db"
import { workspaces } from "@/db/tables/workspace"

const hardCodedUUID = "f7b3b3b3-4b3b-4b3b-4b3b-4b3b3b3b3b3b"
export async function seedWorkspaces() {
  // Create default workspace
  await db
    .insert(workspaces)
    .values({
      id: hardCodedUUID,
      name: "Test Church HQ",
      location: "123 Church St",
      imageUrl: "https://images.unsplash.com/photo-1519491050282-cf00c82424b4",
      description: "Default workspace for Test Church HQ",
    })
    .execute()
}

export async function getFirstWorkspaceId() {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .limit(1)
  return workspace.id
}
