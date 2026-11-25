/**
 * Member Types
 * Types and schemas for member-related data
 */

import { z } from "zod"
import type { Translate } from "@church/config"

// Validation messages are translated, so the member schemas are built per locale (see event-form.tsx).

/**
 * Personal information schema
 */
export function buildPersonalInfoSchema(t: Translate) {
  return z.object({
    firstName: z.string().min(2, t("final.member.firstNameMin")),
    lastName: z.string().min(2, t("final.member.lastNameMin")),
    birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: t("final.member.invalidDate"),
    }),
    gender: z.enum(["Male", "Female"]),
    maritalStatus: z.enum(["Married", "Single", "Divorced", "Widowed"], {
      required_error: t("final.member.maritalStatusRequired"),
    }),
    birthPlace: z.string().optional(),
    occupation: z.string().optional(),
    tribe: z.string().optional(),
  })
}

export type PersonalInfo = z.infer<ReturnType<typeof buildPersonalInfoSchema>>

/**
 * Church information schema
 */
export function buildChurchInfoSchema(t: Translate) {
  return z.object({
    salvationDate: z
      .string()
      .optional()
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: t("final.member.invalidDate"),
      }),
    baptismDate: z
      .string()
      .optional()
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: t("final.member.invalidDate"),
      }),
    anointedDate: z
      .string()
      .optional()
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: t("final.member.invalidDate"),
      }),
    joinedDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: t("final.member.invalidDate"),
    }),
    holySpirit: z.boolean(),
  })
}

export type ChurchInfo = z.infer<ReturnType<typeof buildChurchInfoSchema>>

/**
 * Contact information schema
 */
export function buildContactInfoSchema(t: Translate) {
  return z.object({
    district: z.string().min(1, t("final.member.districtRequired")),
    ward: z.string().min(1, t("final.member.wardRequired")),
    street: z.string().min(1, t("final.member.streetRequired")),
    houseNumber: z.string().optional(),
    phone: z.string().min(10, t("final.member.phoneMin")),
    zoneId: z.string().nullable(),
    landmark: z.string().optional(),
  })
}

export type ContactInfo = z.infer<ReturnType<typeof buildContactInfoSchema>>

export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export function buildMemberFormSchema(t: Translate) {
  return z.object({
    personalInfo: buildPersonalInfoSchema(t),
    churchInfo: buildChurchInfoSchema(t),
    contactInfo: buildContactInfoSchema(t),
    emergencyContact1: emergencyContactSchema.optional(),
    emergencyContact2: emergencyContactSchema.optional(),
  })
}

export type MemberFormData = z.infer<ReturnType<typeof buildMemberFormSchema>>

//  CreateMemberData should be the same as MemberFormData but with feild number added
export type CreateMemberData = MemberFormData & { number: string }
