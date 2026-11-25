"use client"

import { useId, useState } from "react"

import { setStaffDocumentVisibility } from "@/actions/library"
import { useT } from "@/components/i18n/locale-provider"

export function StaffDocumentVisibilityToggle({
  churchId,
  documentId,
  visibleToMembers,
}: {
  churchId: string
  documentId: string
  visibleToMembers: boolean
}) {
  const { t } = useT()
  const id = useId()
  const [checked, setChecked] = useState(visibleToMembers)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleChange(next: boolean) {
    const previous = checked
    setChecked(next)
    setPending(true)
    setFailed(false)
    try {
      await setStaffDocumentVisibility(churchId, documentId, next)
    } catch {
      // Put the checkbox back to the saved value and say so.
      setChecked(previous)
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4"
          checked={checked}
          disabled={pending}
          onChange={(event) => void handleChange(event.target.checked)}
        />
        <label htmlFor={id}>{t("staff.content.visible")}</label>
      </div>
      {failed && (
        <p role="alert" className="text-destructive text-xs">
          {t("component.content.visibilityError")}
        </p>
      )}
    </div>
  )
}
