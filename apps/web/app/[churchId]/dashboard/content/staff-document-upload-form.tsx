"use client"

import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { uploadStaffDocument } from "@/actions/library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/components/i18n/locale-provider"

export function StaffDocumentUploadForm({ churchId }: { churchId: string }) {
  const { t } = useT()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await uploadStaffDocument(churchId, new FormData(event.currentTarget))
      formRef.current?.reset()
      toast.success(t("staff.content.upload.success"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("staff.content.upload.error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-md border p-5">
      <div>
        <h2 className="text-base font-semibold">{t("staff.content.upload.heading")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("staff.content.upload.description")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-document-file">{t("staff.content.fieldFile")}</Label>
        <Input id="staff-document-file" name="file" type="file" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-document-title">{t("staff.content.fieldTitle")}</Label>
        <Input id="staff-document-title" name="title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-document-description">{t("staff.content.upload.fieldDescription")}</Label>
        <Textarea id="staff-document-description" name="description" rows={3} className="resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="staff-document-visible"
          name="visibleToMembers"
          type="checkbox"
          className="h-4 w-4"
        />
        <Label htmlFor="staff-document-visible">{t("staff.content.upload.visible")}</Label>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("staff.content.upload.submitting") : t("staff.content.upload.submit")}
      </Button>
    </form>
  )
}
