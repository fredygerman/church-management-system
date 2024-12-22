"use server"

import { z } from "zod"

import { memberFormSchema } from "@/types/member"

export async function createMember(formData: z.infer<typeof memberFormSchema>) {
  // Validate the form data
  try {
    const validatedData = memberFormSchema.parse(formData)
    console.log("Member data received:", validatedData)
    // In a real application, you would save the data to a database here
    return { success: true, message: "Member created successfully" }
  } catch (error) {
    console.error("Validation error:", error)
    return { success: false, message: "Failed to create member" }
  }
}
