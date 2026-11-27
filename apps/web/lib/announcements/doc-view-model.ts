// Pure model for announcement bodies (doc_v1). The React renderer maps this model to elements,
// so the link allow-list, mark mapping and unknown-node handling can be tested without rendering.
// Nothing here returns HTML: unknown node types are skipped and every value is typed or dropped.

export type ViewInline =
  | { kind: "text"; text: string; bold: boolean; italic: boolean; href: string | null }
  | { kind: "break" }

export type ViewBlock =
  | { kind: "paragraph"; children: ViewInline[] }
  | { kind: "heading"; level: 1 | 2; children: ViewInline[] }
  | { kind: "bulletList"; items: ViewBlock[][] }
  | { kind: "orderedList"; items: ViewBlock[][] }
  | { kind: "blockquote"; children: ViewBlock[] }
  | { kind: "image"; attachmentId: string; alt: string }
  | { kind: "file"; attachmentId: string; name: string | null }

export interface FileRef {
  attachmentId: string
  name: string | null
}

// Nesting guard: a malformed or hostile body cannot recurse without limit.
const MAX_DEPTH = 12

// Attachment ids are generated ids (letters, digits, `_` and `-`). Anything else is dropped.
const ATTACHMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// Only https links. Anything else (http, javascript:, data:, relative, malformed) is not a link.
export function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith("https://")) return false
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

export function isValidAttachmentId(value: unknown): value is string {
  return typeof value === "string" && ATTACHMENT_ID_PATTERN.test(value)
}

export function resolveMarks(marks: unknown): { bold: boolean; italic: boolean; href: string | null } {
  let bold = false
  let italic = false
  let href: string | null = null
  if (!Array.isArray(marks)) return { bold, italic, href }

  for (const mark of marks) {
    if (!isRecord(mark)) continue
    if (mark.type === "bold") bold = true
    else if (mark.type === "italic") italic = true
    else if (mark.type === "link" && href === null) {
      const attrs: Record<string, unknown> = isRecord(mark.attrs) ? mark.attrs : {}
      if (isSafeHttpsUrl(attrs.href)) href = attrs.href
    }
  }
  return { bold, italic, href }
}

function toInlines(nodes: unknown): ViewInline[] {
  if (!Array.isArray(nodes)) return []
  const inlines: ViewInline[] = []
  for (const node of nodes) {
    if (!isRecord(node)) continue
    if (node.type === "text" && typeof node.text === "string" && node.text.length > 0) {
      inlines.push({ kind: "text", text: node.text, ...resolveMarks(node.marks) })
    } else if (node.type === "hardBreak") {
      inlines.push({ kind: "break" })
    }
  }
  return inlines
}

function toListItems(nodes: unknown, depth: number): ViewBlock[][] {
  if (!Array.isArray(nodes)) return []
  const items: ViewBlock[][] = []
  for (const node of nodes) {
    if (!isRecord(node) || node.type !== "listItem") continue
    items.push(toBlocks(node.content, depth + 1))
  }
  return items
}

function toBlock(node: Record<string, unknown>, depth: number): ViewBlock | null {
  const attrs: Record<string, unknown> = isRecord(node.attrs) ? node.attrs : {}

  switch (node.type) {
    case "paragraph":
      return { kind: "paragraph", children: toInlines(node.content) }
    case "heading":
      // Only level 1 is the top heading; every other level renders as level 2.
      return { kind: "heading", level: attrs.level === 1 ? 1 : 2, children: toInlines(node.content) }
    case "bulletList":
      return { kind: "bulletList", items: toListItems(node.content, depth) }
    case "orderedList":
      return { kind: "orderedList", items: toListItems(node.content, depth) }
    case "blockquote":
      return { kind: "blockquote", children: toBlocks(node.content, depth + 1) }
    case "image": {
      if (!isValidAttachmentId(attrs.attachmentId)) return null
      return {
        kind: "image",
        attachmentId: attrs.attachmentId,
        alt: typeof attrs.alt === "string" ? attrs.alt : "",
      }
    }
    case "fileAttachment": {
      if (!isValidAttachmentId(attrs.attachmentId)) return null
      const name = typeof attrs.name === "string" && attrs.name.trim() !== "" ? attrs.name.trim() : null
      return { kind: "file", attachmentId: attrs.attachmentId, name }
    }
    default:
      return null
  }
}

function toBlocks(nodes: unknown, depth: number): ViewBlock[] {
  if (!Array.isArray(nodes) || depth > MAX_DEPTH) return []
  const blocks: ViewBlock[] = []
  for (const node of nodes) {
    if (!isRecord(node)) continue
    const block = toBlock(node, depth)
    if (block) blocks.push(block)
  }
  return blocks
}

// Converts a stored doc_v1 value into view blocks. Anything that is not a doc yields no blocks.
export function docToViewModel(doc: unknown): ViewBlock[] {
  if (!isRecord(doc) || doc.type !== "doc") return []
  return toBlocks(doc.content, 0)
}

// Files are listed in their own section, so the body renderer skips them.
// Duplicate attachments (the same file placed twice) are listed once, in first-seen order.
export function collectFiles(blocks: ViewBlock[]): FileRef[] {
  const files: FileRef[] = []
  const seen = new Set<string>()

  function visit(list: ViewBlock[]) {
    for (const block of list) {
      if (block.kind === "file") {
        if (!seen.has(block.attachmentId)) {
          seen.add(block.attachmentId)
          files.push({ attachmentId: block.attachmentId, name: block.name })
        }
      } else if (block.kind === "bulletList" || block.kind === "orderedList") {
        for (const item of block.items) visit(item)
      } else if (block.kind === "blockquote") {
        visit(block.children)
      }
    }
  }

  visit(blocks)
  return files
}
