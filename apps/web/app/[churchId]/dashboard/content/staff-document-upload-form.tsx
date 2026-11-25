"use client"

import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { uploadStaffDocument } from "@/actions/library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function StaffDocumentUploadForm({ churchId }: { churchId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await uploadStaffDocument(churchId, new FormData(event.currentTarget))
      formRef.current?.reset()
      toast.success("Document uploaded.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be uploaded.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-md border p-5">
      <div>
        <h2 className="text-base font-semibold">Upload a document</h2>
        <p className="text-muted-foreground text-sm">
          Staff can add files to the shared library. Leave visibility off to keep it staff-only.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-document-file">File</Label>
        <Input id="staff-document-file" name="file" type="file" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-document-title">Title</Label>
        <Input id="staff-document-title" name="title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-document-description">Description (optional)</Label>
        <Textarea id="staff-document-description" name="description" rows={3} className="resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="staff-document-visible"
          name="visibleToMembers"
          type="checkbox"
          className="h-4 w-4"
        />
        <Label htmlFor="staff-document-visible">Visible to members in the library</Label>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading…" : "Upload document"}
      </Button>
    </form>
  )
}
