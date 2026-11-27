"use client"

import { useState, type FormEvent } from "react"
import { useT } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { VerseEntry, VerseEntryInput } from "./actions"

interface VerseEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: VerseEntry | null
  // Resolves to true when the save worked, so the dialog can close.
  onSave: (input: VerseEntryInput, entry: VerseEntry | null) => Promise<boolean>
}

export function VerseEntryDialog({ open, onOpenChange, entry, onSave }: VerseEntryDialogProps) {
  const { t } = useT()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? t("verses.edit") : t("verses.add")}</DialogTitle>
        </DialogHeader>
        <VerseEntryForm entry={entry} onSave={onSave} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

// Rendered inside DialogContent, so it unmounts on close and every open starts from the entry's values.
function VerseEntryForm({
  entry,
  onSave,
  onDone,
}: {
  entry: VerseEntry | null
  onSave: VerseEntryDialogProps["onSave"]
  onDone: () => void
}) {
  const { t } = useT()
  const [reference, setReference] = useState(entry?.reference ?? "")
  const [textEn, setTextEn] = useState(entry?.textEn ?? "")
  const [textSw, setTextSw] = useState(entry?.textSw ?? "")
  const [saving, setSaving] = useState(false)

  const canSave = reference.trim() !== "" && textEn.trim() !== ""

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    const saved = await onSave(
      { reference: reference.trim(), textEn: textEn.trim(), textSw: textSw.trim() || null },
      entry,
    )
    setSaving(false)
    if (saved) onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verse-reference">{t("verses.field.reference")}</Label>
        <Input
          id="verse-reference"
          value={reference}
          placeholder={t("verses.field.referenceHint")}
          onChange={(event) => setReference(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="verse-text-en">{t("verses.field.textEn")}</Label>
        <Textarea
          id="verse-text-en"
          value={textEn}
          onChange={(event) => setTextEn(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="verse-text-sw">{t("verses.field.textSw")}</Label>
        <Textarea
          id="verse-text-sw"
          value={textSw}
          onChange={(event) => setTextSw(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("verses.field.textSwHint")}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("verses.cancel")}
        </Button>
        <Button type="submit" disabled={!canSave || saving}>
          {t("verses.save")}
        </Button>
      </div>
    </form>
  )
}
