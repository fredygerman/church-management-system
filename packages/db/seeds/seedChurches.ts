import { db } from "@/db"
import { churches } from "@/db/tables/churches"
import { eq } from "drizzle-orm"

const hardCodedUUID = "f7b3b3b3-4b3b-4b3b-4b3b-4b3b3b3b3b3b"

export async function seedChurches() {
  // Check if the church already exists
  const existingChurch = await db
    .select()
    .from(churches)
    .where(eq(churches.id, hardCodedUUID))
    .execute()

  if (existingChurch.length === 0) {
    // Create default church if it doesn't exist
    await db
      .insert(churches)
      .values({
        id: hardCodedUUID,
        name: "Test Church HQ",
        location: "123 Church St",
        imageUrl:
          "https://images.unsplash.com/photo-1519491050282-cf00c82424b4",
        description: "Default church for Test Church HQ",
      })
      .execute()
  }
}

export async function getFirstChurchId() {
  const [church] = await db
    .select({ id: churches.id })
    .from(churches)
    .limit(1)
  return church.id
}
