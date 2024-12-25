import { createMember } from "@/actions/member"
import { db } from "@/db"

import { generateFriendlyMemberNumber } from "@/lib/utils"

import { zones } from "../tables/zones"

export async function seedMembers(workspaceId: string) {
  const zoneIds = await db.select({ id: zones.id }).from(zones) // Fetch zone IDs

  const memberData: Array<{
    fullName: string
    birthDate: string
    gender: "Male" | "Female"
    maritalStatus: "Single" | "Married" | "Divorced" | "Widowed"
    joinedDate: string
    zoneId: string
  }> = [
    {
      fullName: "John Doe",
      birthDate: new Date("1990-01-01").toISOString(),
      gender: "Male",
      maritalStatus: "Single",
      joinedDate: new Date().toISOString(),
      zoneId: zoneIds[0].id, // Assign a zone ID
    },
    {
      fullName: "Jane Smith",
      birthDate: new Date("1985-05-15").toISOString(),
      gender: "Female",
      maritalStatus: "Married",
      joinedDate: new Date().toISOString(),
      zoneId: zoneIds[1].id, // Assign a zone ID
    },
    // ...add more members as needed
  ]

  for (let i = 0; i < 8; i++) {
    memberData.push({
      fullName: `Member ${i + 3}`,
      birthDate: new Date(`198${i}-01-01`).toISOString(),
      gender: i % 2 === 0 ? "Male" : "Female",
      maritalStatus: i % 2 === 0 ? "Single" : "Married",
      joinedDate: new Date().toISOString(),
      zoneId: zoneIds[i % zoneIds.length].id, // Assign a zone ID
    })
  }

  for (const member of memberData) {
    const validBirthDate =
      member.birthDate && member.birthDate.trim() !== ""
        ? member.birthDate
        : new Date().toISOString()
    const validJoinedDate =
      member.joinedDate && member.joinedDate.trim() !== ""
        ? member.joinedDate
        : new Date().toISOString()

    await createMember({
      personalInfo: {
        fullName: member.fullName,
        birthDate: validBirthDate,
        gender: member.gender,
        maritalStatus: member.maritalStatus,
      },
      churchInfo: {
        joinedDate: validJoinedDate,
        holySpirit: true,
      },
      contactInfo: {
        district: "Default District",
        ward: "Default Ward",
        street: "Default Street",
        phone: "000-000-0000",
        zoneId: member.zoneId,
      },
      workspaceId,
    })
  }

  console.log("✅ Members seeded")
}
