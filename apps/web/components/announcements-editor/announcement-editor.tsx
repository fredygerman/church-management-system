"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EditorContent, useEditor } from "@tiptap/react"
import { translatorFor, type Locale } from "@church/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { docV1IsEmpty, editorJsonToDocV1, type DocV1 } from "@/lib/announcements/doc"
import {
  createAnnouncement,
  publishAnnouncement,
  updateAnnouncement,
  uploadAnnouncementAttachment,
} from "./actions"
import { AttachmentLabelsProvider, buildAnnouncementExtensions, type AttachmentLabels } from "./tiptap-extensions"
import { EditorToolbar } from "./editor-toolbar"
import {
  STATUS_KEYS,
  SUMMARY_MAX,
  TITLE_MAX,
  announcementErrorKey,
  announcementFieldProblem,
  attachmentProblem,
  attachmentProblemKey,
  normalizeSummary,
  type AnnouncementDetail,
  type AnnouncementInput,
  type AnnouncementStatus,
  type AttachmentKind,
} from "./rules"

export interface AnnouncementEditorProps {
  churchId: string
  locale: Locale
  canPublish: boolean
  announcement: AnnouncementDetail | null
}

const EMPTY_DOC: DocV1 = { type: "doc", content: [] }

// Fields that decide whether there are unsaved changes.
function stateKey(title: string, summary: string, body: DocV1): string {
  return JSON.stringify([title, summary, body])
}

function altFromName(name: string): string {
  return name.replace(/\.[^.]+$/, "")
}

export function AnnouncementEditor({ churchId, locale, canPublish, announcement }: AnnouncementEditorProps) {
  const router = useRouter()
  const t = useMemo(() => translatorFor(locale), [locale])
  const extensions = useMemo(() => buildAnnouncementExtensions(), [])
  const labels = useMemo<AttachmentLabels>(
    () => ({
      imageLoading: t("announcements.image.loading"),
      imageUnavailable: t("announcements.image.unavailable"),
      fileLoading: t("announcements.file.loading"),
      fileOpen: t("announcements.file.open"),
      fileUnavailable: t("announcements.file.unavailable"),
    }),
    [t],
  )

  const [id, setId] = useState<string | null>(announcement?.id ?? null)
  const [status, setStatus] = useState<AnnouncementStatus>(announcement?.status ?? "draft")
  const [title, setTitle] = useState(announcement?.title ?? "")
  const [summary, setSummary] = useState(announcement?.summary ?? "")
  const [body, setBody] = useState<DocV1>(announcement?.body ?? EMPTY_DOC)
  const [savedKey, setSavedKey] = useState(() =>
    stateKey(announcement?.title ?? "", announcement?.summary ?? "", announcement?.body ?? EMPTY_DOC),
  )
  const [busy, setBusy] = useState<"saving" | "publishing" | "uploading" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const editable = canPublish && status === "draft"
  const dirty = stateKey(title, summary, body) !== savedKey

  const editor = useEditor({
    extensions,
    content: body,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-64 px-4 py-3 text-sm leading-relaxed focus:outline-none [&_p]:my-2 [&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline",
        "aria-label": t("announcements.field.body"),
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: updated }) => setBody(editorJsonToDocV1(updated.getJSON())),
  })

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  // Saves the title, summary and body as a draft. Returns the draft id, or null when it failed.
  async function persistDraft(): Promise<string | null> {
    const problem = announcementFieldProblem(title, summary)
    if (problem) {
      setMessage(t(problem))
      return null
    }
    const payload: AnnouncementInput = {
      title: title.trim(),
      summary: normalizeSummary(summary),
      body,
      channels: ["in_app"],
    }
    const snapshot = stateKey(title, summary, body)
    const result = id ? await updateAnnouncement(id, payload) : await createAnnouncement(payload)
    if (!result.ok) {
      setMessage(t(announcementErrorKey(result.code)))
      return null
    }
    const savedId = result.data.id || id
    setId(savedId)
    setSavedKey(snapshot)
    return savedId
  }

  async function handleSaveDraft() {
    setMessage(null)
    setBusy("saving")
    const savedId = await persistDraft()
    setBusy(null)
    if (!savedId) return
    toast.success(t("announcements.saved"))
    if (!announcement) router.replace(`/${churchId}/dashboard/announcements/${savedId}`)
  }

  async function handlePublish() {
    setConfirmOpen(false)
    setMessage(null)
    const problem = announcementFieldProblem(title, summary)
    if (problem) {
      setMessage(t(problem))
      return
    }
    if (docV1IsEmpty(body)) {
      setMessage(t("announcements.validation.bodyRequired"))
      return
    }
    setBusy("publishing")
    let targetId = id
    if (!targetId || dirty) {
      targetId = await persistDraft()
      if (!targetId) {
        setBusy(null)
        return
      }
    }
    const result = await publishAnnouncement(targetId)
    setBusy(null)
    if (!result.ok) {
      setMessage(t(announcementErrorKey(result.code)))
      return
    }
    setStatus(result.data.status)
    toast.success(
      t(result.data.status === "published" ? "announcements.published" : "announcements.sentForApproval"),
    )
    if (!announcement) {
      router.replace(`/${churchId}/dashboard/announcements/${targetId}`)
    } else {
      router.refresh()
    }
  }

  async function handleAttachment(kind: AttachmentKind, file: File) {
    const problem = attachmentProblem(kind, file)
    if (problem) {
      setMessage(t(attachmentProblemKey(problem)))
      return
    }
    if (!editor) return
    setMessage(null)
    setBusy("uploading")
    const form = new FormData()
    form.append("file", file)
    const result = await uploadAnnouncementAttachment(form)
    setBusy(null)
    if (!result.ok) {
      setMessage(t(announcementErrorKey(result.code, "attachmentFailed")))
      return
    }
    if (kind === "image") {
      editor
        .chain()
        .focus()
        .insertContent({ type: "image", attrs: { attachmentId: result.data.id, alt: altFromName(result.data.name) } })
        .run()
    } else {
      editor
        .chain()
        .focus()
        .insertContent({ type: "fileAttachment", attrs: { attachmentId: result.data.id, name: result.data.name } })
        .run()
    }
  }

  const controlsDisabled = !editable || busy !== null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link href={`/${churchId}/dashboard/announcements`} className="text-muted-foreground text-sm underline">
          {t("announcements.editor.back")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {announcement ? t("announcements.editor.editTitle") : t("announcements.editor.newTitle")}
          </h1>
          {announcement ? <Badge variant="outline">{t(STATUS_KEYS[status])}</Badge> : null}
        </div>
        <p className="text-muted-foreground text-sm">{t("announcements.editor.description")}</p>
      </div>

      {!canPublish ? (
        <p role="status" className="rounded-md border px-3 py-2 text-sm">
          {t("announcements.viewOnly")}
        </p>
      ) : null}
      {canPublish && status !== "draft" ? (
        <p role="status" className="rounded-md border px-3 py-2 text-sm">
          {t("announcements.readOnly")}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="announcement-title" className="text-sm font-medium">
          {t("announcements.field.title")}
        </label>
        <Input
          id="announcement-title"
          value={title}
          maxLength={TITLE_MAX}
          disabled={!editable || busy !== null}
          onChange={(event) => setTitle(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("announcements.field.titleHint")}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="announcement-summary" className="text-sm font-medium">
          {t("announcements.field.summary")}
        </label>
        <Textarea
          id="announcement-summary"
          rows={2}
          value={summary}
          maxLength={SUMMARY_MAX}
          disabled={!editable || busy !== null}
          onChange={(event) => setSummary(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("announcements.field.summaryHint")}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("announcements.field.body")}</p>
        {editor && editable ? (
          <EditorToolbar
            editor={editor}
            t={t}
            disabled={controlsDisabled}
            onImageChosen={(file) => void handleAttachment("image", file)}
            onFileChosen={(file) => void handleAttachment("file", file)}
          />
        ) : null}
        <div className="rounded-md border">
          <AttachmentLabelsProvider labels={labels}>
            <EditorContent editor={editor} />
          </AttachmentLabelsProvider>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">{t("announcements.channels.heading")}</legend>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" defaultChecked disabled />
          <span>
            <span className="font-medium">{t("announcements.channels.inApp")}</span>
            <span className="text-muted-foreground block text-xs">{t("announcements.channels.inAppNote")}</span>
          </span>
        </label>
        <label className="text-muted-foreground flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" disabled />
          <span>
            <span>{t("announcements.channels.email")}</span>
            <span className="block text-xs">{t("announcements.channels.unavailable")}</span>
          </span>
        </label>
        <label className="text-muted-foreground flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" disabled />
          <span>
            <span>{t("announcements.channels.sms")}</span>
            <span className="block text-xs">{t("announcements.channels.unavailable")}</span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="min-h-5 text-sm">
          {message ? (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          ) : editable && dirty ? (
            <p className="text-muted-foreground">{t("announcements.unsaved")}</p>
          ) : null}
        </div>
        {editable ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={controlsDisabled} onClick={() => void handleSaveDraft()}>
              {busy === "saving" ? t("announcements.actions.saving") : t("announcements.actions.saveDraft")}
            </Button>
            <Button type="button" disabled={controlsDisabled} onClick={() => setConfirmOpen(true)}>
              {busy === "publishing" ? t("announcements.actions.publishing") : t("announcements.actions.publish")}
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("announcements.confirm.title")}</DialogTitle>
            <DialogDescription>{t("announcements.confirm.body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("announcements.actions.cancel")}
            </Button>
            <Button type="button" onClick={() => void handlePublish()}>
              {t("announcements.confirm.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
