"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatLocaleDate, type Locale, type MessageKey } from "@church/config"
import { useT } from "@/components/i18n/locale-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  clearVerseOverride,
  createVerseEntry,
  deleteVerseEntry,
  setVerseOverride,
  updateVerseEntry,
  type VerseEntry,
  type VerseEntryInput,
  type VerseOverride,
  type VerseResult,
} from "./actions"
import { buildDateRows, selectableEntries, type VerseDateRow, type VerseSource } from "./date-rows"
import { VerseEntryDialog } from "./verse-entry-dialog"

interface VersesAdminProps {
  churchId: string
  startDate: string
  entries: VerseEntry[]
  overrides: VerseOverride[]
  canManage: boolean
}

const SOURCE_KEYS: Record<VerseSource, MessageKey> = {
  override: "verses.source.override",
  rotation: "verses.source.rotation",
  default: "verses.source.default",
}

// The date is parsed as local midnight so the weekday matches the calendar day in the viewer's time zone.
function formatDay(date: string, locale: Locale): string {
  return formatLocaleDate(new Date(`${date}T00:00:00`), locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function VersesAdmin({ churchId, startDate, entries, overrides, canManage }: VersesAdminProps) {
  const { t, locale } = useT()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [formEntry, setFormEntry] = useState<VerseEntry | null>(null)
  const [deleting, setDeleting] = useState<VerseEntry | null>(null)

  const rows = buildDateRows({ startDate, overrides, entries })

  // Shows the outcome of a write: a toast and a refresh of the server data on success, the mapped verses.* message on failure.
  function report(result: VerseResult<unknown>) {
    if (result.ok) {
      toast.success(t("verses.saved"))
      router.refresh()
    } else {
      toast.error(t(result.errorKey))
    }
  }

  function runWrite(task: () => Promise<VerseResult<unknown>>) {
    startTransition(async () => {
      report(await task())
    })
  }

  // Called by the entry dialog. It reports the result itself and tells the dialog whether to close.
  async function saveEntry(input: VerseEntryInput, entry: VerseEntry | null): Promise<boolean> {
    const result = entry
      ? await updateVerseEntry(churchId, entry.id, input)
      : await createVerseEntry(churchId, input)
    report(result)
    return result.ok
  }

  function openForm(entry: VerseEntry | null) {
    setFormEntry(entry)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!deleting) return
    const id = deleting.id
    setDeleting(null)
    runWrite(() => deleteVerseEntry(churchId, id))
  }

  function renderDayPicker(row: VerseDateRow) {
    const choices = selectableEntries(entries, row.entryId)
    if (choices.length === 0) return null
    return (
      <Select
        // Remounts when the saved choice changes, so the trigger shows the new value.
        key={`${row.date}:${row.entryId ?? ""}`}
        value={row.entryId ?? undefined}
        disabled={isPending}
        onValueChange={(entryId) => runWrite(() => setVerseOverride(churchId, row.date, entryId))}
      >
        <SelectTrigger className="w-full sm:w-72" aria-label={t("verses.overrides.choose")}>
          <SelectValue placeholder={t("verses.overrides.choose")} />
        </SelectTrigger>
        <SelectContent>
          {choices.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              {entry.reference}
              {!entry.active ? ` (${t("verses.list.inactive")})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="space-y-6">
      {!canManage && <p className="text-sm text-muted-foreground">{t("verses.readOnly")}</p>}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle>{t("verses.list.heading")}</CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => openForm(null)} disabled={isPending}>
              {t("verses.add")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("verses.list.empty")}</p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{entry.reference}</span>
                      {!entry.active && <Badge variant="secondary">{t("verses.list.inactive")}</Badge>}
                    </div>
                    <p className="text-sm">{entry.textEn}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.textSw?.trim() ? entry.textSw : t("verses.swMissing")}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openForm(entry)} disabled={isPending}>
                        {t("verses.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => runWrite(() => updateVerseEntry(churchId, entry.id, { active: !entry.active }))}
                      >
                        {entry.active ? t("verses.deactivate") : t("verses.activate")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={isPending}
                        onClick={() => setDeleting(entry)}
                      >
                        {t("verses.delete")}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("verses.overrides.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.date} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-28 font-medium">{formatDay(row.date, locale)}</span>
                  {row.isToday && <Badge variant="outline">{t("verses.today")}</Badge>}
                </div>
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {row.reference && <span className="font-medium">{row.reference}</span>}
                    <Badge variant="secondary">{t(SOURCE_KEYS[row.source])}</Badge>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap items-center gap-2">
                      {renderDayPicker(row)}
                      {row.source === "override" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => runWrite(() => clearVerseOverride(churchId, row.date))}
                        >
                          {t("verses.overrides.clear")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <VerseEntryDialog open={formOpen} onOpenChange={setFormOpen} entry={formEntry} onSave={saveEntry} />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("verses.confirmDelete")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("verses.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("verses.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
