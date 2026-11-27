// Pure helpers for the doc_v1 announcement body. No React or React Native imports, so these run under node:test.
// Unknown node and mark types are skipped; links are kept only when they are https.

export type InlineRun = { text: string; bold: boolean; italic: boolean; href: string | null }

export type RichBlock =
  | { kind: "paragraph"; runs: InlineRun[] }
  | { kind: "heading"; level: 1 | 2; runs: InlineRun[] }
  | { kind: "list"; ordered: boolean; items: RichBlock[][] }
  | { kind: "quote"; blocks: RichBlock[] }
  | { kind: "image"; attachmentId: string; alt: string }
  | { kind: "file"; attachmentId: string; name: string }

export type FileBlock = Extract<RichBlock, { kind: "file" }>

type JsonObject = Record<string, unknown>
type Format = { bold: boolean; italic: boolean; href: string | null }

const HTTPS_LINK = /^https:\/\/[^\s<>"']+$/i

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function children(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function attrsOf(node: JsonObject): JsonObject {
  return isObject(node.attrs) ? node.attrs : {}
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

/** Returns the link only when it is an https URL; anything else is shown as plain text. */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null
  const href = value.trim()
  return HTTPS_LINK.test(href) ? href : null
}

function formatOf(marks: unknown): Format {
  const format: Format = { bold: false, italic: false, href: null }
  for (const mark of children(marks)) {
    if (!isObject(mark)) continue
    if (mark.type === "bold") format.bold = true
    else if (mark.type === "italic") format.italic = true
    else if (mark.type === "link" && format.href === null) format.href = safeHref(attrsOf(mark).href)
  }
  return format
}

/** Flattens inline nodes into runs. Adjacent text with the same bold, italic and link is merged. */
export function flattenInline(content: unknown): InlineRun[] {
  const runs: InlineRun[] = []
  const push = (text: string, format: Format) => {
    if (text === "") return
    const last = runs[runs.length - 1]
    if (last && last.bold === format.bold && last.italic === format.italic && last.href === format.href) {
      last.text += text
    } else {
      runs.push({ text, ...format })
    }
  }
  for (const node of children(content)) {
    if (!isObject(node)) continue
    if (node.type === "text" && typeof node.text === "string") {
      push(node.text, formatOf(node.marks))
    } else if (node.type === "hardBreak") {
      push("\n", { bold: false, italic: false, href: null })
    }
  }
  return runs
}

function hasVisibleText(runs: InlineRun[]): boolean {
  return runs.some((run) => run.text.trim() !== "")
}

function toBlock(node: JsonObject): RichBlock | null {
  switch (node.type) {
    case "paragraph": {
      const runs = flattenInline(node.content)
      return hasVisibleText(runs) ? { kind: "paragraph", runs } : null
    }
    case "heading": {
      const runs = flattenInline(node.content)
      if (!hasVisibleText(runs)) return null
      return { kind: "heading", level: attrsOf(node).level === 1 ? 1 : 2, runs }
    }
    case "bulletList":
    case "orderedList": {
      const items: RichBlock[][] = []
      for (const item of children(node.content)) {
        if (!isObject(item) || item.type !== "listItem") continue
        const blocks = toBlocks(item.content)
        if (blocks.length > 0) items.push(blocks)
      }
      return items.length > 0 ? { kind: "list", ordered: node.type === "orderedList", items } : null
    }
    case "blockquote": {
      const blocks = toBlocks(node.content)
      return blocks.length > 0 ? { kind: "quote", blocks } : null
    }
    case "image": {
      const attachmentId = nonEmptyString(attrsOf(node).attachmentId)
      if (!attachmentId) return null
      return { kind: "image", attachmentId, alt: nonEmptyString(attrsOf(node).alt) ?? "" }
    }
    case "fileAttachment": {
      const attachmentId = nonEmptyString(attrsOf(node).attachmentId)
      if (!attachmentId) return null
      return { kind: "file", attachmentId, name: nonEmptyString(attrsOf(node).name) ?? "" }
    }
    default:
      return null
  }
}

/** Block nodes in order. Empty paragraphs and unknown or malformed nodes are dropped. */
export function toBlocks(content: unknown): RichBlock[] {
  const blocks: RichBlock[] = []
  for (const node of children(content)) {
    if (!isObject(node)) continue
    const block = toBlock(node)
    if (block) blocks.push(block)
  }
  return blocks
}

/** Blocks of a whole doc_v1 document. Anything that is not a doc yields no blocks. */
export function toDocBlocks(value: unknown): RichBlock[] {
  if (!isObject(value) || value.type !== "doc") return []
  return toBlocks(value.content)
}

/** Every file block in the tree, in order, without repeating an attachment. */
export function collectFiles(blocks: RichBlock[]): FileBlock[] {
  const files: FileBlock[] = []
  const seen = new Set<string>()
  const visit = (list: RichBlock[]) => {
    for (const block of list) {
      if (block.kind === "file") {
        if (!seen.has(block.attachmentId)) {
          seen.add(block.attachmentId)
          files.push(block)
        }
      } else if (block.kind === "list") {
        block.items.forEach(visit)
      } else if (block.kind === "quote") {
        visit(block.blocks)
      }
    }
  }
  visit(blocks)
  return files
}

/** The same tree with every file block removed, for when the files are listed separately. */
export function withoutFiles(blocks: RichBlock[]): RichBlock[] {
  const result: RichBlock[] = []
  for (const block of blocks) {
    if (block.kind === "file") continue
    if (block.kind === "list") {
      const items = block.items.map(withoutFiles).filter((item) => item.length > 0)
      if (items.length > 0) result.push({ ...block, items })
    } else if (block.kind === "quote") {
      const inner = withoutFiles(block.blocks)
      if (inner.length > 0) result.push({ ...block, blocks: inner })
    } else {
      result.push(block)
    }
  }
  return result
}
