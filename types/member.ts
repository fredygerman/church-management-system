import { z } from "zod"

export const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  gender: z.enum(["Male", "Female"]),
  maritalStatus: z.enum(["Married", "Single", "Divorced", "Widowed"], {
    required_error: "Please select a marital status",
  }),
  birthPlace: z.string().optional(),
  occupation: z.string().optional(),
  tribe: z.string().optional(),
})

export const churchInfoSchema = z.object({
  salvationDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  baptismDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  anointedDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  joinedDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  holySpirit: z.boolean(),
})

export const contactInfoSchema = z.object({
  district: z.string().min(1, "District is required"),
  ward: z.string().min(1, "Ward is required"),
  street: z.string().min(1, "Street is required"),
  houseNumber: z.string().optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  zoneId: z.string().nullable(),
  landmark: z.string().optional(),
})

export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const memberFormSchema = z.object({
  personalInfo: personalInfoSchema,
  churchInfo: churchInfoSchema,
  contactInfo: contactInfoSchema,
  emergencyContact1: emergencyContactSchema.optional(),
  emergencyContact2: emergencyContactSchema.optional(),
})

export type MemberFormData = z.infer<typeof memberFormSchema>

//  CreateMemberData should be the same as MemberFormData but with feild number added
export type CreateMemberData = MemberFormData & { number: string }
