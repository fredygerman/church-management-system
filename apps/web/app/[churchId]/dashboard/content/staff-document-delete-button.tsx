"use client"

import { useState } from "react"
import { toast } from "sonner"

import { deleteStaffDocument } from "@/actions/library"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useT } from "@/components/i18n/locale-provider"

export function StaffDocumentDeleteButton({
  churchId,
  documentId,
  title,
}: {
  churchId: string
  documentId: string
  title: string
}) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteStaffDocument(churchId, documentId)
      toast.success(t("staff.content.delete.success"))
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("staff.content.delete.error"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={t("staff.content.delete.ariaLabel", { title })}
        onClick={() => setOpen(true)}
      >
        {t("staff.content.delete.button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("staff.content.delete.heading", { title })}</DialogTitle>
            <DialogDescription>
              {t("staff.content.delete.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t("staff.content.delete.deleting") : t("staff.content.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
