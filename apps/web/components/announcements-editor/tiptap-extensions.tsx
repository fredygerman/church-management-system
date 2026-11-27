"use client"

// Tiptap setup for the announcement body. Only the nodes and marks in doc_v1 are enabled, so the editor
// cannot produce anything editorJsonToDocV1 would have to drop. The two attachment nodes render through their
// signed URL, which is fetched on the server and never stored in the body.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { Node, mergeAttributes, type NodeViewProps, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { isHttpsUrl } from "@/lib/announcements/doc"
import { getAnnouncementAttachmentUrl } from "./actions"

export interface AttachmentLabels {
  imageLoading: string
  imageUnavailable: string
  fileLoading: string
  fileOpen: string
  fileUnavailable: string
}

const AttachmentLabelsContext = createContext<AttachmentLabels>({
  imageLoading: "",
  imageUnavailable: "",
  fileLoading: "",
  fileOpen: "",
  fileUnavailable: "",
})

/** Wrap the editor content in this so the node views can show translated labels. */
export function AttachmentLabelsProvider({ labels, children }: { labels: AttachmentLabels; children: ReactNode }) {
  return <AttachmentLabelsContext.Provider value={labels}>{children}</AttachmentLabelsContext.Provider>
}

type SignedUrlState = { status: "loading" } | { status: "ready"; url: string } | { status: "error" }

// Fetches a signed URL for an attachment and refreshes it shortly before it expires.
function useSignedUrl(attachmentId: string): SignedUrlState {
  const [state, setState] = useState<SignedUrlState>({ status: "loading" })

  useEffect(() => {
    if (attachmentId === "") {
      setState({ status: "error" })
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function load() {
      const result = await getAnnouncementAttachmentUrl(attachmentId)
      if (cancelled) return
      if (!result.ok) {
        setState({ status: "error" })
        return
      }
      setState({ status: "ready", url: result.data.url })
      const expiresIn = Number.isFinite(result.data.expiresIn) ? result.data.expiresIn : 300
      timer = setTimeout(() => void load(), Math.max(30, expiresIn - 60) * 1000)
    }

    void load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [attachmentId])

  return state
}

function ImageAttachmentView({ node }: NodeViewProps) {
  const labels = useContext(AttachmentLabelsContext)
  const attachmentId = typeof node.attrs.attachmentId === "string" ? node.attrs.attachmentId : ""
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : ""
  const state = useSignedUrl(attachmentId)

  return (
    <NodeViewWrapper className="my-3" data-attachment-id={attachmentId}>
      {state.status === "ready" ? (
        // Signed storage URL: next/image cannot optimise it, so a plain img is correct here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={state.url} alt={alt} className="max-h-96 max-w-full rounded-md border object-contain" />
      ) : (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          {state.status === "error" ? labels.imageUnavailable : labels.imageLoading}
        </div>
      )}
    </NodeViewWrapper>
  )
}

function FileAttachmentView({ node }: NodeViewProps) {
  const labels = useContext(AttachmentLabelsContext)
  const attachmentId = typeof node.attrs.attachmentId === "string" ? node.attrs.attachmentId : ""
  const name = typeof node.attrs.name === "string" ? node.attrs.name : ""
  const state = useSignedUrl(attachmentId)

  let action: ReactNode
  if (state.status === "ready") {
    action = (
      <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-primary shrink-0 font-medium underline">
        {labels.fileOpen}
      </a>
    )
  } else {
    action = (
      <span className="text-muted-foreground shrink-0">
        {state.status === "error" ? labels.fileUnavailable : labels.fileLoading}
      </span>
    )
  }

  return (
    <NodeViewWrapper className="my-3" data-attachment-id={attachmentId}>
      <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
        <span className="truncate">{name}</span>
        {action}
      </div>
    </NodeViewWrapper>
  )
}

// Named `image` so the JSON matches doc_v1 directly.
export const ImageAttachment = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId: { default: "" },
      alt: { default: "" },
    }
  },

  parseHTML() {
    return [
      {
        tag: "img[data-attachment-id]",
        getAttrs: (element) => ({
          attachmentId: element.getAttribute("data-attachment-id") ?? "",
          alt: element.getAttribute("alt") ?? "",
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return ["img", mergeAttributes({ "data-attachment-id": node.attrs.attachmentId, alt: node.attrs.alt })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageAttachmentView)
  },
})

// Named `fileAttachment` to match doc_v1.
export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId: { default: "" },
      name: { default: "" },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-file-attachment]",
        getAttrs: (element) => ({
          attachmentId: element.getAttribute("data-file-attachment") ?? "",
          name: element.textContent ?? "",
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return ["div", mergeAttributes({ "data-file-attachment": node.attrs.attachmentId }), node.attrs.name]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentView)
  },
})

/** Extensions for the announcement editor. The same list is used for read-only display. */
export function buildAnnouncementExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2] },
      // Not in doc_v1, so they are switched off rather than dropped later.
      code: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      // Configured separately below so the https rule applies.
      link: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      protocols: ["https"],
      isAllowedUri: (url) => isHttpsUrl(url),
    }),
    ImageAttachment,
    FileAttachment,
  ]
}
