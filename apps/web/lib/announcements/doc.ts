// Pure helpers for the announcement body (doc_v1). No React imports: these run in node tests and on the server.
//
// doc_v1 is the saved body: { type: "doc", content: [...] }. Anything outside the allowlist below is dropped,
// so the editor's JSON can never store a node or mark the members' renderer does not know.

export type DocV1MarkType = "bold" | "italic" | "link"

export interface DocV1Mark {
  type: DocV1MarkType
  attrs?: { href: string }
}

export interface DocV1Node {
  type: string
  attrs?: Record<string, string | number>
  content?: DocV1Node[]
  marks?: DocV1Mark[]
  text?: string
}

export interface DocV1 {
  type: "doc"
  content: DocV1Node[]
}

export const MAX_LINK_LENGTH = 2048
export const MAX_ALT_LENGTH = 500
export const MAX_ATTACHMENT_NAME_LENGTH = 255

// What each parent may contain. Leaves (text, hardBreak, image, fileAttachment) have no entry.
const BLOCK_TYPES = ["paragraph", "heading", "bulletList", "orderedList", "blockquote", "image", "fileAttachment"]
const CHILD_RULES: Record<string, ReadonlySet<string>> = {
  doc: new Set(BLOCK_TYPES),
  paragraph: new Set(["text", "hardBreak"]),
  heading: new Set(["text", "hardBreak"]),
  bulletList: new Set(["listItem"]),
  orderedList: new Set(["listItem"]),
  listItem: new Set(BLOCK_TYPES),
  blockquote: new Set(BLOCK_TYPES),
}
// Containers that are invalid when empty (a list with no items, a quote with no content).
const NEEDS_CHILDREN = new Set(["bulletList", "orderedList", "listItem", "blockquote"])

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** True for an absolute https URL with a host and no embedded credentials. */
export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  if (trimmed === "" || trimmed.length > MAX_LINK_LENGTH) return false
  try {
    const url = new URL(trimmed)
    return url.protocol === "https:" && url.hostname !== "" && url.username === "" && url.password === ""
  } catch {
    return false
  }
}

function sanitizeMarks(value: unknown): DocV1Mark[] {
  if (!Array.isArray(value)) return []
  const marks: DocV1Mark[] = []
  for (const mark of value) {
    if (!isObject(mark)) continue
    if (mark.type === "bold" || mark.type === "italic") {
      marks.push({ type: mark.type })
    } else if (mark.type === "link" && isObject(mark.attrs) && isHttpsUrl(mark.attrs.href)) {
      marks.push({ type: "link", attrs: { href: mark.attrs.href.trim() } })
    }
    // Any other mark, and a link that is not https, is dropped. The text stays.
  }
  return marks
}

function sanitizeChildren(value: unknown, allowed: ReadonlySet<string>): DocV1Node[] {
  if (!Array.isArray(value)) return []
  const out: DocV1Node[] = []
  for (const child of value) {
    const node = sanitizeNode(child, allowed)
    if (node) out.push(node)
  }
  return out
}

function sanitizeNode(value: unknown, allowed: ReadonlySet<string>): DocV1Node | null {
  if (!isObject(value) || typeof value.type !== "string" || !allowed.has(value.type)) return null

  switch (value.type) {
    case "text": {
      if (typeof value.text !== "string" || value.text === "") return null
      const marks = sanitizeMarks(value.marks)
      return marks.length > 0 ? { type: "text", text: value.text, marks } : { type: "text", text: value.text }
    }
    case "hardBreak":
      return { type: "hardBreak" }
    case "paragraph":
      return { type: "paragraph", content: sanitizeChildren(value.content, CHILD_RULES.paragraph!) }
    case "heading": {
      const content = sanitizeChildren(value.content, CHILD_RULES.heading!)
      const level = isObject(value.attrs) ? value.attrs.level : undefined
      // Only levels 1 and 2 exist in the body. Any other heading keeps its text as a paragraph.
      if (level === 1 || level === 2) return { type: "heading", attrs: { level }, content }
      return { type: "paragraph", content }
    }
    case "image": {
      const attrs = isObject(value.attrs) ? value.attrs : {}
      const attachmentId = typeof attrs.attachmentId === "string" ? attrs.attachmentId.trim() : ""
      if (attachmentId === "") return null
      const alt = typeof attrs.alt === "string" ? attrs.alt.trim().slice(0, MAX_ALT_LENGTH) : ""
      return { type: "image", attrs: { attachmentId, alt } }
    }
    case "fileAttachment": {
      const attrs = isObject(value.attrs) ? value.attrs : {}
      const attachmentId = typeof attrs.attachmentId === "string" ? attrs.attachmentId.trim() : ""
      if (attachmentId === "") return null
      const name = typeof attrs.name === "string" ? attrs.name.trim().slice(0, MAX_ATTACHMENT_NAME_LENGTH) : ""
      return { type: "fileAttachment", attrs: { attachmentId, name } }
    }
    default: {
      const rule = CHILD_RULES[value.type]
      if (!rule) return null
      const content = sanitizeChildren(value.content, rule)
      if (content.length === 0 && NEEDS_CHILDREN.has(value.type)) return null
      return { type: value.type, content }
    }
  }
}

/**
 * Maps editor JSON (Tiptap getJSON(), or a stored doc_v1) to a clean doc_v1.
 * Unknown nodes and marks are dropped, non-https links lose their link mark but keep their text,
 * and anything that does not fit the allowed parent is removed. Always returns a doc, even for bad input.
 */
export function editorJsonToDocV1(json: unknown): DocV1 {
  if (!isObject(json) || json.type !== "doc") return { type: "doc", content: [] }
  return { type: "doc", content: sanitizeChildren(json.content, CHILD_RULES.doc!) }
}

function hasMeaningfulContent(nodes: DocV1Node[]): boolean {
  return nodes.some((node) => {
    if (node.type === "text") return (node.text ?? "").trim() !== ""
    if (node.type === "image" || node.type === "fileAttachment") return true
    return hasMeaningfulContent(node.content ?? [])
  })
}

/** True when the body has no text and no images or files. Used before publishing. */
export function docV1IsEmpty(doc: unknown): boolean {
  return !hasMeaningfulContent(editorJsonToDocV1(doc).content)
}
