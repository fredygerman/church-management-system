"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createMember } from "@/actions/member"
import { uuid } from "drizzle-orm/pg-core"
import { toast } from "sonner"

import { memberFormSchema, type MemberFormData } from "@/types/member"
import { Button } from "@/components/ui/Button"

import { ChurchInfoStep } from "./ChurchInfoStep"
import { ContactInfoStep } from "./ContactInfoStep"
import { EmergencyContactsStep } from "./EmergencyContactsStep"
import { PersonalInfoStep } from "./PersonalInfoStep"

const steps = [
  "Personal Information",
  "Church Information",
  "Contact Information",
  "Emergency Contacts",
]

export function MemberForm({
  workspaceId,
  zones,
}: {
  workspaceId: string
  zones: any[]
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<MemberFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleStepSubmit = (stepData: Partial<MemberFormData>) => {
    setFormData((prevData) => ({ ...prevData, ...stepData }))
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFormSubmit()
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleFormSubmit = async () => {
    setIsSubmitting(true)
    try {
      const validatedData = memberFormSchema.parse(formData)
      console.log("Validated data:", validatedData)

      // Ensure optional date fields are either null or valid date strings
      const sanitizedData = {
        ...validatedData,
        churchInfo: {
          ...validatedData.churchInfo,
          salvationDate: validatedData.churchInfo.salvationDate || undefined,
          baptismDate: validatedData.churchInfo.baptismDate || undefined,
          anointedDate: validatedData.churchInfo.anointedDate || undefined,
        },
        contactInfo: {
          ...validatedData.contactInfo,
          zoneId: validatedData.contactInfo.zoneId || null,
        },
      }

      // if no_zone is selected, set zoneId to null
      if (
        sanitizedData.contactInfo.zoneId === "no_zone" ||
        typeof sanitizedData.contactInfo.zoneId !== typeof uuid()
      ) {
        sanitizedData.contactInfo.zoneId = null
      }

      console.log("Sanitized data:", sanitizedData)
      console.log("Workspace ID:", workspaceId)

      const result = await createMember({
        ...sanitizedData,
        workspaceId,
      })
      if (result.success) {
        toast.custom((t) => (
          <div className="rounded bg-background p-4 shadow-lg">
            <p className="font-semibold">Form submitted successfully</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                className="rounded bg-blue-500 px-4 py-2 text-foreground"
                onClick={() => {
                  toast.dismiss((t as unknown as { id: string | number }).id)
                  router.push(`/${workspaceId}/dashboard/members`)
                }}
              >
                Go to Members
              </button>
              <button
                className="rounded bg-green-500 px-4 py-2 text-foreground"
                onClick={() => {
                  toast.dismiss((t as unknown as { id: string | number }).id)
                  setCurrentStep(0)
                  setFormData({})
                }}
              >
                Add Another
              </button>
            </div>
          </div>
        ))
      } else {
        toast.error("An error occurred while submitting the form")
      }
    } catch (error) {
      console.error("Validation error:", error)
      toast.error("Please check your inputs and try again.")
    } finally {
      setIsSubmitting(false)
      // scroll to top of the page
      window.scrollTo(0, 0)
      router.push(`/${workspaceId}/dashboard/members`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">{steps[currentStep]}</h2>
        <div className="mt-4 flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-16 rounded ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {currentStep === 0 && (
        <PersonalInfoStep
          data={
            formData.personalInfo || {
              fullName: "",
              birthDate: new Date().toISOString().split("T")[0],
              gender: "Male",
              maritalStatus: "Single",
            }
          }
          onSubmit={(data) => handleStepSubmit({ personalInfo: data })}
        />
      )}
      {currentStep === 1 && (
        <ChurchInfoStep
          data={
            formData.churchInfo || {
              joinedDate: new Date().toISOString().split("T")[0],
              holySpirit: false,
              salvationDate: undefined,
              baptismDate: undefined,
              anointedDate: undefined,
            }
          }
          onSubmit={(data) => handleStepSubmit({ churchInfo: data })}
          onBack={handleBack}
        />
      )}
      {currentStep === 2 && (
        <ContactInfoStep
          data={{
            ...formData.contactInfo,
            zoneId: formData.contactInfo?.zoneId ?? undefined,
            district: formData.contactInfo?.district ?? "",
            ward: formData.contactInfo?.ward ?? "",
            street: formData.contactInfo?.street ?? "",
            phone: formData.contactInfo?.phone ?? "",
            houseNumber: formData.contactInfo?.houseNumber ?? "",
            landmark: formData.contactInfo?.landmark ?? "",
          }}
          zones={zones}
          onSubmit={(data) =>
            handleStepSubmit({
              contactInfo: { ...data, zoneId: data.zoneId || null },
            })
          }
          onBack={handleBack}
        />
      )}
      {currentStep === 3 && (
        <EmergencyContactsStep
          data={{
            emergencyContact1: {
              name: formData.emergencyContact1?.name,
              relation: formData.emergencyContact1?.relation,
              phone: formData.emergencyContact1?.phone,
              address: formData.emergencyContact1?.address,
            },
            emergencyContact2: {
              name: formData.emergencyContact2?.name,
              relation: formData.emergencyContact2?.relation,
              phone: formData.emergencyContact2?.phone,
              address: formData.emergencyContact2?.address,
            },
          }}
          onSubmit={(data) => handleStepSubmit(data)}
          onBack={handleBack}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
