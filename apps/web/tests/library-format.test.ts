import { test } from "node:test"
import assert from "node:assert/strict"
import { dictionaries, translatorFor, type MessageKey, type Translate } from "@church/config"
import type { LibraryDocument } from "../actions/library"
import { formatBytes, formatFileType } from "../app/[churchId]/portal/library/library-format"

// Fake translator: returns the key itself, so assertions can name the fallback key.
const keyOnly: Translate = (key: MessageKey) => key

function doc(overrides: Partial<LibraryDocument>): LibraryDocument {
  return {
    id: "doc-1",
    title: "Doc",
    original_file_name: "file.pdf",
    content_type: "application/pdf",
    size_bytes: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

test("formatBytes: zero and sub-KB sizes are shown in bytes", () => {
  assert.equal(formatBytes(0, keyOnly), "0 B")
  assert.equal(formatBytes(1, keyOnly), "1 B")
  assert.equal(formatBytes(1023, keyOnly), "1023 B")
})

test("formatBytes: KB uses one decimal below 10 and none from 10 up", () => {
  assert.equal(formatBytes(1024, keyOnly), "1.0 KB")
  assert.equal(formatBytes(1536, keyOnly), "1.5 KB")
  assert.equal(formatBytes(10 * 1024, keyOnly), "10 KB")
})

test("formatBytes: MB and GB", () => {
  assert.equal(formatBytes(1024 * 1024, keyOnly), "1.0 MB")
  assert.equal(formatBytes(5 * 1024 ** 3, keyOnly), "5.0 GB")
  assert.equal(formatBytes(1024 ** 4, keyOnly), "1.0 TB")
})

test("formatBytes: negative, NaN and infinite sizes use the unknown-size key", () => {
  assert.equal(formatBytes(-1, keyOnly), "portal.library.unknownSize")
  assert.equal(formatBytes(Number.NaN, keyOnly), "portal.library.unknownSize")
  assert.equal(formatBytes(Number.POSITIVE_INFINITY, keyOnly), "portal.library.unknownSize")
})

test("formatBytes: English translator gives readable unknown-size text", () => {
  assert.equal(formatBytes(-1, translatorFor("en")), dictionaries.en["portal.library.unknownSize"])
})

test("formatFileType: uses the upper-cased extension of the original file name", () => {
  assert.equal(formatFileType(doc({ original_file_name: "report.pdf" }), keyOnly), "PDF")
  assert.equal(formatFileType(doc({ original_file_name: "archive.tar.gz" }), keyOnly), "GZ")
})

test("formatFileType: without an extension, falls back to the content type subtype", () => {
  assert.equal(
    formatFileType(doc({ original_file_name: "scan", content_type: "application/pdf" }), keyOnly),
    "PDF",
  )
})

test("formatFileType: missing name and type fall back to the translated label", () => {
  const bare = doc({
    original_file_name: null,
    content_type: null,
  } as unknown as Partial<LibraryDocument>)
  assert.equal(formatFileType(bare, keyOnly), "portal.library.fileFallback")

  const empty = doc({ original_file_name: "", content_type: "" })
  assert.equal(formatFileType(empty, keyOnly), "portal.library.fileFallback")
})

test("formatFileType: English translator gives readable fallback text", () => {
  const bare = doc({ original_file_name: "", content_type: "" })
  assert.equal(formatFileType(bare, translatorFor("en")), dictionaries.en["portal.library.fileFallback"])
})
