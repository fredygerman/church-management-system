import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { collectFiles, flattenInline, safeHref, toBlocks, toDocBlocks, withoutFiles } from "../components/rich-text/model"

describe("flattenInline (bold and italic merging)", () => {
  it("merges adjacent text that has the same marks", () => {
    const runs = flattenInline([
      { type: "text", text: "Karibu ", marks: [{ type: "bold" }] },
      { type: "text", text: "sana", marks: [{ type: "bold" }] },
    ])
    assert.deepEqual(runs, [{ text: "Karibu sana", bold: true, italic: false, href: null }])
  })

  it("keeps bold and italic runs apart when their marks differ", () => {
    const runs = flattenInline([
      { type: "text", text: "Plain " },
      { type: "text", text: "bold", marks: [{ type: "bold" }] },
      { type: "text", text: " both", marks: [{ type: "bold" }, { type: "italic" }] },
    ])
    assert.deepEqual(runs, [
      { text: "Plain ", bold: false, italic: false, href: null },
      { text: "bold", bold: true, italic: false, href: null },
      { text: " both", bold: true, italic: true, href: null },
    ])
  })

  it("applies italic on its own and ignores unknown marks", () => {
    const runs = flattenInline([{ type: "text", text: "soft", marks: [{ type: "italic" }, { type: "underline" }] }])
    assert.deepEqual(runs, [{ text: "soft", bold: false, italic: true, href: null }])
  })

  it("turns a hard break into a newline run and skips text without a string value", () => {
    const runs = flattenInline([
      { type: "text", text: "line one" },
      { type: "hardBreak" },
      { type: "text", text: "line two" },
      { type: "text" },
      { type: "text", text: "" },
    ])
    assert.equal(runs.map((run) => run.text).join(""), "line one\nline two")
  })
})

describe("safeHref (link allow-list)", () => {
  it("accepts https links", () => {
    assert.equal(safeHref("https://church.example/give"), "https://church.example/give")
    assert.equal(safeHref("HTTPS://church.example"), "HTTPS://church.example")
  })

  it("rejects http, javascript, mailto, relative and empty links", () => {
    assert.equal(safeHref("http://church.example"), null)
    assert.equal(safeHref("javascript:alert(1)"), null)
    assert.equal(safeHref("mailto:office@church.example"), null)
    assert.equal(safeHref("/events"), null)
    assert.equal(safeHref("https://"), null)
    assert.equal(safeHref(""), null)
    assert.equal(safeHref(42), null)
  })

  it("shows a link with an unsafe href as plain text", () => {
    const runs = flattenInline([{ type: "text", text: "tap", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }])
    assert.deepEqual(runs, [{ text: "tap", bold: false, italic: false, href: null }])
  })

  it("keeps an https link on its text and separates it from plain text", () => {
    const runs = flattenInline([
      { type: "text", text: "Read " },
      { type: "text", text: "more", marks: [{ type: "link", attrs: { href: "https://church.example/news" } }] },
    ])
    assert.deepEqual(runs, [
      { text: "Read ", bold: false, italic: false, href: null },
      { text: "more", bold: false, italic: false, href: "https://church.example/news" },
    ])
  })
})

describe("toDocBlocks (block nodes)", () => {
  it("skips unknown node types silently and keeps the known ones in order", () => {
    const blocks = toDocBlocks({
      type: "doc",
      content: [
        { type: "embedTable", attrs: { rows: 3 } },
        { type: "paragraph", content: [{ type: "text", text: "Before" }] },
        { type: "video", attrs: { src: "https://church.example/v.mp4" } },
        { type: "paragraph", content: [{ type: "text", text: "After" }] },
      ],
    })
    assert.deepEqual(blocks.map((block) => block.kind), ["paragraph", "paragraph"])
    assert.equal(blocks[1]?.kind === "paragraph" ? blocks[1].runs[0]?.text : "", "After")
  })

  it("skips unknown children of list items and non-item list children", () => {
    const blocks = toBlocks([
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [{ type: "unknownBlock" }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Kwaya" }] }] },
          { type: "paragraph" },
        ],
      },
    ])
    assert.equal(blocks.length, 1)
    const list = blocks[0]
    assert.equal(list?.kind, "list")
    if (list?.kind === "list") {
      assert.equal(list.ordered, false)
      assert.equal(list.items.length, 1)
    }
  })

  it("treats any document that is not a doc as empty", () => {
    assert.deepEqual(toDocBlocks(null), [])
    assert.deepEqual(toDocBlocks("text"), [])
    assert.deepEqual(toDocBlocks({ type: "paragraph", content: [] }), [])
    assert.deepEqual(toDocBlocks({ type: "doc" }), [])
  })

  it("drops an empty paragraph and a paragraph that holds only a line break", () => {
    const blocks = toBlocks([
      { type: "paragraph" },
      { type: "paragraph", content: [] },
      { type: "paragraph", content: [{ type: "hardBreak" }] },
      { type: "paragraph", content: [{ type: "text", text: "   " }] },
      { type: "paragraph", content: [{ type: "text", text: "Visible" }] },
    ])
    assert.equal(blocks.length, 1)
    assert.equal(blocks[0]?.kind, "paragraph")
  })

  it("coerces heading levels to 1 or 2", () => {
    const blocks = toBlocks([
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Big" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Smaller" }] },
      { type: "heading", attrs: { level: 6 }, content: [{ type: "text", text: "Odd" }] },
    ])
    assert.deepEqual(blocks.map((block) => (block.kind === "heading" ? block.level : null)), [1, 2, 2])
  })

  it("keeps images and files only when they carry an attachment id", () => {
    const blocks = toBlocks([
      { type: "image", attrs: { attachmentId: "att_1", alt: "Choir" } },
      { type: "image", attrs: { alt: "No id" } },
      { type: "fileAttachment", attrs: { attachmentId: "att_2", name: "Programme.pdf" } },
      { type: "fileAttachment", attrs: { name: "Orphan.pdf" } },
    ])
    assert.deepEqual(blocks, [
      { kind: "image", attachmentId: "att_1", alt: "Choir" },
      { kind: "file", attachmentId: "att_2", name: "Programme.pdf" },
    ])
  })

  it("reads blockquote content recursively", () => {
    const blocks = toBlocks([
      { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Quoted" }] }] },
    ])
    assert.equal(blocks[0]?.kind, "quote")
  })
})

describe("collectFiles and withoutFiles", () => {
  const blocks = toBlocks([
    { type: "paragraph", content: [{ type: "text", text: "Intro" }] },
    { type: "fileAttachment", attrs: { attachmentId: "att_a", name: "A.pdf" } },
    { type: "blockquote", content: [{ type: "fileAttachment", attrs: { attachmentId: "att_b", name: "B.pdf" } }] },
    { type: "fileAttachment", attrs: { attachmentId: "att_a", name: "A again.pdf" } },
  ])

  it("collects each file once, including files nested in quotes", () => {
    assert.deepEqual(collectFiles(blocks).map((file) => file.attachmentId), ["att_a", "att_b"])
  })

  it("removes file blocks at every level and keeps the rest", () => {
    const rest = withoutFiles(blocks)
    assert.deepEqual(rest.map((block) => block.kind), ["paragraph"])
  })
})
