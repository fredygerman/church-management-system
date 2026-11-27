import { test } from "node:test"
import assert from "node:assert/strict"
import {
  docV1IsEmpty,
  editorJsonToDocV1,
  isHttpsUrl,
} from "../lib/announcements/doc"

const para = (...content: unknown[]) => ({ type: "paragraph", content })
const text = (value: string, marks?: unknown[]) =>
  marks ? { type: "text", text: value, marks } : { type: "text", text: value }

test("editorJsonToDocV1: keeps the allowed nodes and marks unchanged", () => {
  const json = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [text("Welcome")] },
      para(
        text("Bold", [{ type: "bold" }]),
        text(" and "),
        text("italic", [{ type: "italic" }]),
        { type: "hardBreak" },
        text("Read", [{ type: "link", attrs: { href: "https://example.org/news" } }]),
      ),
      { type: "bulletList", content: [{ type: "listItem", content: [para(text("One"))] }] },
      { type: "orderedList", content: [{ type: "listItem", content: [para(text("First"))] }] },
      { type: "blockquote", content: [para(text("A verse"))] },
      { type: "image", attrs: { attachmentId: "att-1", alt: "Choir" } },
      { type: "fileAttachment", attrs: { attachmentId: "att-2", name: "Programme.pdf" } },
    ],
  }
  assert.deepEqual(editorJsonToDocV1(json), json)
})

test("editorJsonToDocV1: drops unknown nodes and unknown marks, keeping the text", () => {
  const json = {
    type: "doc",
    content: [
      { type: "codeBlock", content: [text("let x = 1")] },
      { type: "horizontalRule" },
      para(text("Hi", [{ type: "underline" }, { type: "strike" }, { type: "bold" }])),
    ],
  }
  assert.deepEqual(editorJsonToDocV1(json), {
    type: "doc",
    content: [para(text("Hi", [{ type: "bold" }]))],
  })
})

test("editorJsonToDocV1: removes a link whose scheme is not https but keeps the text", () => {
  const json = {
    type: "doc",
    content: [
      para(
        text("plain", [{ type: "link", attrs: { href: "http://example.org" } }]),
        text(" js", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]),
        text(" mail", [{ type: "link", attrs: { href: "mailto:a@example.org" } }]),
        text(" bare", [{ type: "link", attrs: {} }]),
      ),
    ],
  }
  assert.deepEqual(editorJsonToDocV1(json), {
    type: "doc",
    content: [para(text("plain"), text(" js"), text(" mail"), text(" bare"))],
  })
})

test("editorJsonToDocV1: drops images and files without an attachment id", () => {
  const json = {
    type: "doc",
    content: [
      { type: "image", attrs: { alt: "no id" } },
      { type: "fileAttachment", attrs: { name: "no-id.pdf" } },
      { type: "image", attrs: { attachmentId: "   " } },
    ],
  }
  assert.deepEqual(editorJsonToDocV1(json), { type: "doc", content: [] })
})

test("editorJsonToDocV1: an image with no alt text gets an empty alt", () => {
  const json = { type: "doc", content: [{ type: "image", attrs: { attachmentId: "att-9" } }] }
  assert.deepEqual(editorJsonToDocV1(json), {
    type: "doc",
    content: [{ type: "image", attrs: { attachmentId: "att-9", alt: "" } }],
  })
})

test("editorJsonToDocV1: heading levels other than 1 and 2 become a paragraph", () => {
  const json = {
    type: "doc",
    content: [{ type: "heading", attrs: { level: 3 }, content: [text("Small")] }],
  }
  assert.deepEqual(editorJsonToDocV1(json), { type: "doc", content: [para(text("Small"))] })
})

test("editorJsonToDocV1: drops empty text and empty lists or quotes that would be invalid", () => {
  const json = {
    type: "doc",
    content: [
      para(text("")),
      { type: "bulletList", content: [] },
      { type: "blockquote", content: [] },
      { type: "bulletList", content: [{ type: "listItem", content: [] }] },
    ],
  }
  assert.deepEqual(editorJsonToDocV1(json), {
    type: "doc",
    content: [para()],
  })
})

test("editorJsonToDocV1: text directly inside the document is dropped", () => {
  const json = { type: "doc", content: [text("stray"), para(text("kept"))] }
  assert.deepEqual(editorJsonToDocV1(json), { type: "doc", content: [para(text("kept"))] })
})

test("editorJsonToDocV1: bad input gives an empty document", () => {
  for (const input of [null, undefined, "doc", 42, [], { type: "paragraph" }, {}]) {
    assert.deepEqual(editorJsonToDocV1(input), { type: "doc", content: [] })
  }
})

test("editorJsonToDocV1 is idempotent", () => {
  const messy = {
    type: "doc",
    content: [para(text("a", [{ type: "link", attrs: { href: "https://x.org" } }]), text("b", [{ type: "x" }]))],
  }
  const once = editorJsonToDocV1(messy)
  assert.deepEqual(editorJsonToDocV1(once), once)
})

test("isHttpsUrl: accepts https links only", () => {
  assert.equal(isHttpsUrl("https://example.org/a?b=1"), true)
  assert.equal(isHttpsUrl("  https://example.org  "), true)
  assert.equal(isHttpsUrl("http://example.org"), false)
  assert.equal(isHttpsUrl("example.org"), false)
  assert.equal(isHttpsUrl("https://"), false)
  assert.equal(isHttpsUrl("https://user:pw@example.org"), false)
  assert.equal(isHttpsUrl(""), false)
  assert.equal(isHttpsUrl(undefined), false)
  assert.equal(isHttpsUrl(`https://example.org/${"a".repeat(2100)}`), false)
})

test("docV1IsEmpty: a blank or whitespace-only body is empty", () => {
  assert.equal(docV1IsEmpty({ type: "doc", content: [] }), true)
  assert.equal(docV1IsEmpty({ type: "doc", content: [para(text("   "))] }), true)
  assert.equal(docV1IsEmpty({ type: "doc", content: [para({ type: "hardBreak" })] }), true)
  assert.equal(docV1IsEmpty(null), true)
})

test("docV1IsEmpty: text, an image or a file makes the body non-empty", () => {
  assert.equal(docV1IsEmpty({ type: "doc", content: [para(text("Hello"))] }), false)
  assert.equal(
    docV1IsEmpty({ type: "doc", content: [{ type: "image", attrs: { attachmentId: "a", alt: "" } }] }),
    false,
  )
  assert.equal(
    docV1IsEmpty({
      type: "doc",
      content: [{ type: "fileAttachment", attrs: { attachmentId: "f", name: "a.pdf" } }],
    }),
    false,
  )
})

test("docV1IsEmpty: text inside a list or quote counts", () => {
  const listed = {
    type: "doc",
    content: [{ type: "bulletList", content: [{ type: "listItem", content: [para(text("Item"))] }] }],
  }
  assert.equal(docV1IsEmpty(listed), false)
})

test("docV1IsEmpty: text whose only mark is an unsafe link still counts as text", () => {
  const unsafe = {
    type: "doc",
    content: [para(text("Visit us", [{ type: "link", attrs: { href: "javascript:void(0)" } }]))],
  }
  assert.equal(docV1IsEmpty(unsafe), false)
})
