"use client"

import { useRef, useState, type ChangeEvent } from "react"
import type { Editor } from "@tiptap/react"
import { useEditorState } from "@tiptap/react"
import { Bold, FileText, Heading1, Heading2, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Quote, Unlink } from "lucide-react"
import type { Translate } from "@church/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isHttpsUrl } from "@/lib/announcements/doc"
import { IMAGE_TYPES, FILE_TYPES } from "./rules"

interface ToolbarFlags {
  bold: boolean
  italic: boolean
  heading1: boolean
  heading2: boolean
  bulletList: boolean
  orderedList: boolean
  quote: boolean
  link: boolean
  canLink: boolean
}

function sameFlags(a: ToolbarFlags, b: ToolbarFlags): boolean {
  return (Object.keys(a) as (keyof ToolbarFlags)[]).every((key) => a[key] === b[key])
}

interface EditorToolbarProps {
  editor: Editor
  t: Translate
  disabled: boolean
  onImageChosen: (file: File) => void
  onFileChosen: (file: File) => void
}

export function EditorToolbar({ editor, t, disabled, onImageChosen, onFileChosen }: EditorToolbarProps) {
  const imageInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState("")
  const [linkError, setLinkError] = useState<string | null>(null)

  const flags = useEditorState({
    editor,
    selector: ({ editor: e }): ToolbarFlags => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      heading1: e.isActive("heading", { level: 1 }),
      heading2: e.isActive("heading", { level: 2 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canLink: !e.state.selection.empty || e.isActive("link"),
    }),
    equalityFn: (a, b) => (a && b ? sameFlags(a, b) : a === b),
  })

  function openLink() {
    setLinkValue(editor.getAttributes("link").href ?? "")
    setLinkError(null)
    setLinkOpen(true)
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setLinkOpen(false)
    setLinkError(null)
  }

  function applyLink() {
    const href = linkValue.trim()
    if (href === "") {
      removeLink()
      return
    }
    if (!isHttpsUrl(href)) {
      setLinkError(t("announcements.validation.linkNotHttps"))
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
    setLinkOpen(false)
    setLinkError(null)
  }

  function pick(handler: (file: File) => void, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Clear the value so choosing the same file again still fires a change.
    event.target.value = ""
    if (file) handler(file)
  }

  const buttonClass = (on: boolean) => (on ? "bg-muted" : "")
  const iconButton = (label: string, on: boolean, onClick: () => void, Icon: typeof Bold, enabled = true) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={buttonClass(on)}
      aria-label={label}
      title={label}
      aria-pressed={on}
      disabled={disabled || !enabled}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  )

  return (
    <div className="space-y-2">
      <div role="toolbar" aria-label={t("announcements.toolbar.label")} className="flex flex-wrap items-center gap-1 rounded-md border p-1">
        {iconButton(t("announcements.toolbar.bold"), flags.bold, () => editor.chain().focus().toggleBold().run(), Bold)}
        {iconButton(t("announcements.toolbar.italic"), flags.italic, () => editor.chain().focus().toggleItalic().run(), Italic)}
        {iconButton(t("announcements.toolbar.heading1"), flags.heading1, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), Heading1)}
        {iconButton(t("announcements.toolbar.heading2"), flags.heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2)}
        {iconButton(t("announcements.toolbar.bulletList"), flags.bulletList, () => editor.chain().focus().toggleBulletList().run(), List)}
        {iconButton(t("announcements.toolbar.orderedList"), flags.orderedList, () => editor.chain().focus().toggleOrderedList().run(), ListOrdered)}
        {iconButton(t("announcements.toolbar.quote"), flags.quote, () => editor.chain().focus().toggleBlockquote().run(), Quote)}
        {iconButton(
          t("announcements.toolbar.link"),
          flags.link,
          () => (linkOpen ? setLinkOpen(false) : openLink()),
          LinkIcon,
          flags.canLink,
        )}
        <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />
        {iconButton(t("announcements.toolbar.image"), false, () => imageInput.current?.click(), ImagePlus)}
        {iconButton(t("announcements.toolbar.file"), false, () => fileInput.current?.click(), FileText)}
        <input
          ref={imageInput}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="hidden"
          tabIndex={-1}
          onChange={(event) => pick(onImageChosen, event)}
        />
        <input
          ref={fileInput}
          type="file"
          accept={FILE_TYPES.join(",")}
          className="hidden"
          tabIndex={-1}
          onChange={(event) => pick(onFileChosen, event)}
        />
      </div>

      {linkOpen && !disabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="announcement-link-input" className="sr-only">
            {t("announcements.link.label")}
          </label>
          <Input
            id="announcement-link-input"
            type="url"
            inputMode="url"
            className="max-w-md"
            placeholder={t("announcements.link.placeholder")}
            value={linkValue}
            aria-invalid={linkError !== null}
            onChange={(event) => {
              setLinkValue(event.target.value)
              setLinkError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                applyLink()
              }
            }}
          />
          <Button type="button" size="sm" onClick={applyLink}>
            {t("announcements.link.apply")}
          </Button>
          {flags.link ? (
            <Button type="button" variant="ghost" size="sm" onClick={removeLink}>
              <Unlink className="mr-1 h-4 w-4" aria-hidden="true" />
              {t("announcements.link.remove")}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={() => setLinkOpen(false)}>
            {t("announcements.link.cancel")}
          </Button>
          {linkError ? (
            <p role="alert" className="text-destructive w-full text-sm">
              {linkError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
