"use client"

import { useState } from "react"
import { updateMember } from "@/actions/member"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/components/i18n/locale-provider"

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
  const { t } = useT()
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
        message: t("component.profile.required"),
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
      setFeedback({ kind: "success", message: t("component.profile.saved") })
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : t("component.profile.fallback"),
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-first-name">{t("component.profile.firstName")}</Label>
          <Input
            id="profile-first-name"
            value={values.firstName}
            onChange={(event) => updateValue("firstName", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-last-name">{t("component.profile.lastName")}</Label>
          <Input
            id="profile-last-name"
            value={values.lastName}
            onChange={(event) => updateValue("lastName", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-date-of-birth">{t("component.profile.dateOfBirth")}</Label>
          <Input
            id="profile-date-of-birth"
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => updateValue("dateOfBirth", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-gender">{t("component.profile.gender")}</Label>
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
            <option value="male">{t("component.profile.genderMale")}</option>
            <option value="female">{t("component.profile.genderFemale")}</option>
            <option value="others">{t("component.profile.genderOthers")}</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-marital-status">{t("component.profile.maritalStatus")}</Label>
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
          <option value="single">{t("component.profile.maritalSingle")}</option>
          <option value="married">{t("component.profile.maritalMarried")}</option>
          <option value="divorced">{t("component.profile.maritalDivorced")}</option>
          <option value="widowed">{t("component.profile.maritalWidowed")}</option>
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
        {pending ? t("common.saving") : t("component.profile.submit")}
      </Button>
    </form>
  )
}
