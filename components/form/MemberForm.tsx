"use client"

import { useState } from "react"
import { toast } from "sonner"

import { memberFormSchema, type MemberFormData } from "@/types/member"
import { createMember } from "@/app/actions/member"

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

export function MemberForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<MemberFormData>>({})

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
    try {
      const validatedData = memberFormSchema.parse(formData)
      console.log("Validated data:", validatedData)
      const result = await createMember(validatedData)
      if (result.success) {
        toast.success("Form submitted successfully")
        // Reset form or redirect
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Validation error:", error)

      toast.error("Please check your inputs and try again.")
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
              birthDate: "",
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
            zoneId: formData.contactInfo?.zoneId ?? "",
            district: formData.contactInfo?.district ?? "",
            ward: formData.contactInfo?.ward ?? "",
            street: formData.contactInfo?.street ?? "",
            phone: formData.contactInfo?.phone ?? "",
            houseNumber: formData.contactInfo?.houseNumber ?? "",
            landmark: formData.contactInfo?.landmark ?? "",
          }}
          onSubmit={(data) =>
            handleStepSubmit({
              contactInfo: { ...data, zoneId: data.zoneId ?? null },
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
        />
      )}
    </div>
  )
}
