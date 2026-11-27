import { test } from "node:test"
import assert from "node:assert/strict"
import {
  collectFiles,
  docToViewModel,
  isSafeHttpsUrl,
  resolveMarks,
  type ViewBlock,
} from "../lib/announcements/doc-view-model"

function doc(...content: unknown[]) {
  return { type: "doc", content }
}

function para(...content: unknown[]) {
  return { type: "paragraph", content }
}

function text(value: string, marks?: unknown[]) {
  return marks ? { type: "text", text: value, marks } : { type: "text", text: value }
}

test("isSafeHttpsUrl: only https URLs are allowed", () => {
  assert.equal(isSafeHttpsUrl("https://example.org/page"), true)
  assert.equal(isSafeHttpsUrl("http://example.org"), false)
  assert.equal(isSafeHttpsUrl("HTTPS://example.org"), false)
  assert.equal(isSafeHttpsUrl("javascript:alert(1)"), false)
  assert.equal(isSafeHttpsUrl("data:text/html,hi"), false)
  assert.equal(isSafeHttpsUrl("//example.org"), false)
  assert.equal(isSafeHttpsUrl("/relative/path"), false)
  assert.equal(isSafeHttpsUrl("https://"), false)
  assert.equal(isSafeHttpsUrl(""), false)
  assert.equal(isSafeHttpsUrl(null), false)
  assert.equal(isSafeHttpsUrl(42), false)
})

test("resolveMarks: bold and italic map to flags; a safe https link is kept", () => {
  assert.deepEqual(resolveMarks([{ type: "bold" }, { type: "italic" }]), {
    bold: true,
    italic: true,
    href: null,
  })
  assert.deepEqual(resolveMarks([{ type: "link", attrs: { href: "https://example.org" } }]), {
    bold: false,
    italic: false,
    href: "https://example.org",
  })
})

test("resolveMarks: unsafe links and unknown marks are dropped", () => {
  assert.deepEqual(resolveMarks([{ type: "link", attrs: { href: "javascript:alert(1)" } }]), {
    bold: false,
    italic: false,
    href: null,
  })
  assert.deepEqual(resolveMarks([{ type: "underline" }, "not-a-mark", null]), {
    bold: false,
    italic: false,
    href: null,
  })
  assert.deepEqual(resolveMarks(undefined), { bold: false, italic: false, href: null })
})

test("docToViewModel: a value that is not a doc yields no blocks", () => {
  assert.deepEqual(docToViewModel(null), [])
  assert.deepEqual(docToViewModel("<script>alert(1)</script>"), [])
  assert.deepEqual(docToViewModel({ type: "html", content: [para(text("x"))] }), [])
  assert.deepEqual(docToViewModel({ type: "doc" }), [])
})

test("docToViewModel: unknown block and inline node types are skipped", () => {
  const blocks = docToViewModel(
    doc(
      { type: "table", content: [para(text("hidden"))] },
      { type: "script", text: "alert(1)" },
      para(text("kept"), { type: "mention", attrs: { id: "x" } }, { type: "inlineSomething" })
    )
  )
  assert.deepEqual(blocks, [
    { kind: "paragraph", children: [{ kind: "text", text: "kept", bold: false, italic: false, href: null }] },
  ])
})

test("docToViewModel: text marks and hard breaks map to inline view nodes", () => {
  const blocks = docToViewModel(
    doc(
      para(
        text("Plain. "),
        text("Bold", [{ type: "bold" }]),
        { type: "hardBreak" },
        text("Link", [{ type: "link", attrs: { href: "https://example.org/news" } }])
      )
    )
  )
  assert.deepEqual(blocks, [
    {
      kind: "paragraph",
      children: [
        { kind: "text", text: "Plain. ", bold: false, italic: false, href: null },
        { kind: "text", text: "Bold", bold: true, italic: false, href: null },
        { kind: "break" },
        { kind: "text", text: "Link", bold: false, italic: false, href: "https://example.org/news" },
      ],
    },
  ])
})

test("docToViewModel: a javascript link keeps its text and loses the link", () => {
  const [block] = docToViewModel(
    doc(para(text("Click", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])))
  )
  assert.deepEqual(block, {
    kind: "paragraph",
    children: [{ kind: "text", text: "Click", bold: false, italic: false, href: null }],
  })
})

test("docToViewModel: empty text nodes are dropped", () => {
  const [block] = docToViewModel(doc(para(text(""), text("after"))))
  assert.deepEqual(block, {
    kind: "paragraph",
    children: [{ kind: "text", text: "after", bold: false, italic: false, href: null }],
  })
})

test("docToViewModel: heading level 1 stays 1; any other level becomes 2", () => {
  const blocks = docToViewModel(
    doc(
      { type: "heading", attrs: { level: 1 }, content: [text("Top")] },
      { type: "heading", attrs: { level: 2 }, content: [text("Sub")] },
      { type: "heading", attrs: { level: 6 }, content: [text("Odd")] },
      { type: "heading", content: [text("No attrs")] }
    )
  )
  assert.deepEqual(
    blocks.map((block) => (block.kind === "heading" ? block.level : block.kind)),
    [1, 2, 2, 2]
  )
})

test("docToViewModel: bullet and ordered lists keep only listItem children", () => {
  const blocks = docToViewModel(
    doc(
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [para(text("one"))] },
          { type: "paragraph", content: [text("stray, not a list item")] },
        ],
      },
      {
        type: "orderedList",
        content: [{ type: "listItem", content: [para(text("first"))] }],
      }
    )
  )
  assert.equal(blocks.length, 2)
  const [bullets, ordered] = blocks as Extract<ViewBlock, { items: unknown }>[]
  assert.equal(bullets?.kind, "bulletList")
  assert.equal(bullets?.kind === "bulletList" ? bullets.items.length : -1, 1)
  assert.equal(ordered?.kind, "orderedList")
  assert.equal(ordered?.kind === "orderedList" ? ordered.items.length : -1, 1)
})

test("docToViewModel: images need a safe attachment id; alt defaults to empty", () => {
  const blocks = docToViewModel(
    doc(
      { type: "image", attrs: { attachmentId: "att_123-abc", alt: "Choir" } },
      { type: "image", attrs: { attachmentId: "att_123" } },
      { type: "image", attrs: { attachmentId: "../../admin/secrets", alt: "bad" } },
      { type: "image", attrs: { alt: "no id" } }
    )
  )
  assert.deepEqual(blocks, [
    { kind: "image", attachmentId: "att_123-abc", alt: "Choir" },
    { kind: "image", attachmentId: "att_123", alt: "" },
  ])
})

test("docToViewModel: file attachments trim names and fall back to null", () => {
  const blocks = docToViewModel(
    doc(
      { type: "fileAttachment", attrs: { attachmentId: "file-1", name: "  Order of service.pdf " } },
      { type: "fileAttachment", attrs: { attachmentId: "file-2", name: "   " } },
      { type: "fileAttachment", attrs: { attachmentId: "bad id!", name: "x.pdf" } }
    )
  )
  assert.deepEqual(blocks, [
    { kind: "file", attachmentId: "file-1", name: "Order of service.pdf" },
    { kind: "file", attachmentId: "file-2", name: null },
  ])
})

test("docToViewModel: nesting is capped so a hostile body cannot recurse without limit", () => {
  let node: unknown = para(text("deep"))
  for (let i = 0; i < 40; i += 1) {
    node = { type: "blockquote", content: [node] }
  }
  const blocks = docToViewModel(doc(node))

  let depth = 0
  let current: ViewBlock | undefined = blocks[0]
  while (current && current.kind === "blockquote") {
    depth += 1
    current = current.children[0]
  }
  assert.ok(depth > 0, "outer blockquote is kept")
  assert.ok(depth <= 13, `nesting stopped at ${depth}`)
})

test("collectFiles: finds files inside lists and quotes, once each, in order", () => {
  const blocks = docToViewModel(
    doc(
      { type: "fileAttachment", attrs: { attachmentId: "f-1", name: "First.pdf" } },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [para(text("see")), { type: "fileAttachment", attrs: { attachmentId: "f-2", name: null } }],
          },
        ],
      },
      {
        type: "blockquote",
        content: [{ type: "fileAttachment", attrs: { attachmentId: "f-1", name: "First.pdf" } }],
      },
      { type: "image", attrs: { attachmentId: "img-1", alt: "" } }
    )
  )
  assert.deepEqual(collectFiles(blocks), [
    { attachmentId: "f-1", name: "First.pdf" },
    { attachmentId: "f-2", name: null },
  ])
})
