/**
 * doc_v1 body validator (D-03). The body is a ProseMirror-style JSON tree. Only the
 * allow-listed nodes and marks below are accepted; anything else is rejected, so no
 * raw HTML is ever stored. Pure function: no I/O.
 */

export const DOC_V1_MAX_BYTES = 64 * 1024
export const DOC_V1_MAX_TEXT_CHARS = 20_000
export const DOC_V1_MAX_IMAGES = 10
export const DOC_V1_MAX_DEPTH = 6
export const DOC_V1_MAX_HREF_LENGTH = 2048
export const DOC_V1_MAX_ALT_LENGTH = 500

const MAX_ISSUES = 5

export interface DocV1Mark {
  type: 'bold' | 'italic' | 'link'
  attrs?: { href: string }
}

export interface DocV1Node {
  type: string
  attrs?: Record<string, unknown>
  content?: DocV1Node[]
  text?: string
  marks?: DocV1Mark[]
}

export type DocV1ValidationResult =
  | { ok: true; doc: DocV1Node }
  | { ok: false; issues: string[] }

/** Child types allowed under each container. Leaves ('text', 'image') are listed as children only. */
const ALLOWED_CHILDREN: Readonly<Record<string, readonly string[]>> = {
  doc: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'image'],
  blockquote: ['paragraph', 'bulletList', 'orderedList', 'image'],
  bulletList: ['listItem'],
  orderedList: ['listItem'],
  listItem: ['paragraph', 'bulletList', 'orderedList', 'image'],
  paragraph: ['text'],
  heading: ['text'],
}

const CONTAINER_TYPES = new Set(Object.keys(ALLOWED_CHILDREN))
const KNOWN_NODE_TYPES = new Set([...CONTAINER_TYPES, 'text', 'image'])
const ALLOWED_NODE_KEYS = new Set(['type', 'attrs', 'content', 'text', 'marks'])
const ALLOWED_MARK_TYPES = new Set(['bold', 'italic', 'link'])
const ALLOWED_MARK_KEYS = new Set(['type', 'attrs'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** A '<' followed by a tag-like character. Plain text is escaped on render, but markup in a body is refused outright. */
const MARKUP_RE = /<\s*\/?\s*[a-zA-Z!?]/
/** Whitespace or control characters inside a URL are a common filter-evasion trick; refuse them. */
const URL_FORBIDDEN_CHARS_RE = /[\s\u0000-\u001f\u007f]/

interface WalkState {
  issues: string[]
  images: number
  textChars: number
}

export function validateDocV1(body: unknown): DocV1ValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, issues: ['body must be a document object'] }
  }

  let serialized: string
  try {
    serialized = JSON.stringify(body)
  } catch {
    return { ok: false, issues: ['body is not valid JSON'] }
  }
  if (Buffer.byteLength(serialized, 'utf8') > DOC_V1_MAX_BYTES) {
    return { ok: false, issues: [`body exceeds ${DOC_V1_MAX_BYTES / 1024} KB`] }
  }

  const state: WalkState = { issues: [], images: 0, textChars: 0 }
  visit(body, null, 1, state)

  if (state.images > DOC_V1_MAX_IMAGES) {
    addIssue(state, `at most ${DOC_V1_MAX_IMAGES} images are allowed`)
  }
  if (state.textChars > DOC_V1_MAX_TEXT_CHARS) {
    addIssue(state, `body text exceeds ${DOC_V1_MAX_TEXT_CHARS} characters`)
  }

  if (state.issues.length > 0) {
    return { ok: false, issues: state.issues }
  }
  return { ok: true, doc: body as unknown as DocV1Node }
}

/** HTTPS-only link check used for the link mark. Exported so other renderers can reuse it. */
export function isSafeHttpsUrl(href: unknown): boolean {
  if (typeof href !== 'string' || href.length === 0 || href.length > DOC_V1_MAX_HREF_LENGTH) return false
  if (URL_FORBIDDEN_CHARS_RE.test(href)) return false
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }
  return url.protocol === 'https:' && url.hostname.length > 0
}

function visit(node: unknown, parentType: string | null, depth: number, state: WalkState): void {
  if (state.issues.length >= MAX_ISSUES) return

  if (!isPlainObject(node)) {
    addIssue(state, 'every node must be an object')
    return
  }

  const type = node.type
  if (typeof type !== 'string' || !KNOWN_NODE_TYPES.has(type)) {
    addIssue(state, `unsupported node type ${describe(type)}`)
    return
  }

  for (const key of Object.keys(node)) {
    if (!ALLOWED_NODE_KEYS.has(key)) {
      addIssue(state, `"${key}" is not allowed on ${type} nodes`)
    }
  }

  if (parentType === null) {
    if (type !== 'doc') addIssue(state, 'the document root must be a doc node')
  } else if (!(ALLOWED_CHILDREN[parentType] ?? []).includes(type)) {
    addIssue(state, `${type} cannot appear inside ${parentType}`)
  }

  if (depth > DOC_V1_MAX_DEPTH) {
    addIssue(state, `content is nested deeper than ${DOC_V1_MAX_DEPTH} levels`)
    return
  }

  checkAttrs(node, type, state)

  if (type !== 'text' && node.marks !== undefined) {
    addIssue(state, `marks are only allowed on text nodes, not ${type}`)
  }

  if (type === 'text') {
    checkText(node, state)
    checkMarks(node, state)
    if (node.content !== undefined) addIssue(state, 'text nodes cannot have content')
    return
  }

  if (type === 'image') {
    state.images += 1
    if (node.content !== undefined) addIssue(state, 'image nodes cannot have content')
    return
  }

  if (node.content === undefined) {
    if (type === 'doc') addIssue(state, 'doc requires a content array')
    return
  }
  if (!Array.isArray(node.content)) {
    addIssue(state, `${type} content must be an array`)
    return
  }
  for (const child of node.content) {
    visit(child, type, depth + 1, state)
  }
}

function checkAttrs(node: Record<string, unknown>, type: string, state: WalkState): void {
  const attrs = node.attrs

  if (type === 'heading') {
    if (!isPlainObject(attrs) || Object.keys(attrs).some((key) => key !== 'level')) {
      addIssue(state, 'heading attrs must be { level: 1 | 2 }')
      return
    }
    if (attrs.level !== 1 && attrs.level !== 2) {
      addIssue(state, 'heading level must be 1 or 2')
    }
    return
  }

  if (type === 'image') {
    if (!isPlainObject(attrs)) {
      addIssue(state, 'image attrs must include attachmentId')
      return
    }
    const allowedKeys = new Set(['attachmentId', 'alt'])
    for (const key of Object.keys(attrs)) {
      if (!allowedKeys.has(key)) addIssue(state, `image attr "${key}" is not allowed`)
    }
    if (typeof attrs.attachmentId !== 'string' || !UUID_RE.test(attrs.attachmentId)) {
      addIssue(state, 'image attachmentId must be a UUID')
    }
    if (attrs.alt !== undefined && (typeof attrs.alt !== 'string' || attrs.alt.length > DOC_V1_MAX_ALT_LENGTH)) {
      addIssue(state, `image alt must be text of at most ${DOC_V1_MAX_ALT_LENGTH} characters`)
    }
    return
  }

  // Every other node type takes no attributes.
  if (attrs !== undefined) {
    addIssue(state, `${type} nodes do not take attrs`)
  }
}

function checkText(node: Record<string, unknown>, state: WalkState): void {
  const text = node.text
  if (typeof text !== 'string' || text.length === 0) {
    addIssue(state, 'text nodes need non-empty text')
    return
  }
  if (MARKUP_RE.test(text)) {
    addIssue(state, 'markup is not allowed in text; use the editor formatting instead')
  }
  state.textChars += text.length
}

function checkMarks(node: Record<string, unknown>, state: WalkState): void {
  const marks = node.marks
  if (marks === undefined) return
  if (!Array.isArray(marks)) {
    addIssue(state, 'text marks must be an array')
    return
  }

  for (const mark of marks) {
    if (!isPlainObject(mark)) {
      addIssue(state, 'every mark must be an object')
      continue
    }
    for (const key of Object.keys(mark)) {
      if (!ALLOWED_MARK_KEYS.has(key)) addIssue(state, `mark key "${key}" is not allowed`)
    }
    const markType = mark.type
    if (typeof markType !== 'string' || !ALLOWED_MARK_TYPES.has(markType)) {
      addIssue(state, `unsupported mark ${describe(markType)}`)
      continue
    }
    if (markType === 'link') {
      const attrs = mark.attrs
      if (!isPlainObject(attrs) || Object.keys(attrs).some((key) => key !== 'href')) {
        addIssue(state, 'link marks need attrs { href }')
        continue
      }
      if (!isSafeHttpsUrl(attrs.href)) {
        addIssue(state, 'links must be absolute https URLs')
      }
    } else if (mark.attrs !== undefined) {
      addIssue(state, `${markType} marks do not take attrs`)
    }
  }
}

function addIssue(state: WalkState, message: string): void {
  if (state.issues.length < MAX_ISSUES && !state.issues.includes(message)) {
    state.issues.push(message)
  }
}

function describe(value: unknown): string {
  const text = typeof value === 'string' ? value : typeof value
  return `"${String(text).slice(0, 40)}"`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
