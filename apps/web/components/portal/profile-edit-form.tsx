"use client"

import { useState } from "react"
import { updateMember } from "@/actions/member"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProfileMember {
  id: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  gender?: string | null
  maritalStatus?: string | null
}

interface ProfileEditFormProps {
  churchId: string
  member: ProfileMember
}

type ProfileValues = {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: "male" | "female" | "others"
  maritalStatus: "single" | "married" | "divorced" | "widowed"
}

function asGender(value: string | null | undefined): ProfileValues["gender"] {
  return value === "female" || value === "others" ? value : "male"
}

function asMaritalStatus(
  value: string | null | undefined
): ProfileValues["maritalStatus"] {
  return value === "married" || value === "divorced" || value === "widowed"
    ? value
    : "single"
}

export function ProfileEditForm({ churchId, member }: ProfileEditFormProps) {
  const [values, setValues] = useState<ProfileValues>({
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    dateOfBirth: member.dateOfBirth?.slice(0, 10) ?? "",
    gender: asGender(member.gender),
    maritalStatus: asMaritalStatus(member.maritalStatus),
  })
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error"
    message: string
  } | null>(null)

  function updateValue<K extends keyof ProfileValues>(
    key: K,
    value: ProfileValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    if (!values.firstName.trim() || !values.lastName.trim()) {
      setFeedback({
        kind: "error",
        message: "First name and last name are required.",
      })
      return
    }

    setPending(true)
    try {
      await updateMember(churchId, member.id, {
        ...values,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      })
      setFeedback({ kind: "success", message: "Your profile was saved." })
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not save your profile.",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-first-name">First name</Label>
          <Input
            id="profile-first-name"
            value={values.firstName}
            onChange={(event) => updateValue("firstName", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-last-name">Last name</Label>
          <Input
            id="profile-last-name"
            value={values.lastName}
            onChange={(event) => updateValue("lastName", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-date-of-birth">Date of birth</Label>
          <Input
            id="profile-date-of-birth"
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => updateValue("dateOfBirth", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-gender">Gender</Label>
          <select
            id="profile-gender"
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={values.gender}
            onChange={(event) =>
              updateValue(
                "gender",
                event.target.value as ProfileValues["gender"]
              )
            }
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="others">Others</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-marital-status">Marital status</Label>
        <select
          id="profile-marital-status"
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          value={values.maritalStatus}
          onChange={(event) =>
            updateValue(
              "maritalStatus",
              event.target.value as ProfileValues["maritalStatus"]
            )
          }
        >
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
        </select>
      </div>

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            feedback.kind === "error"
              ? "text-destructive text-sm"
              : "text-primary text-sm"
          }
        >
          {feedback.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}
