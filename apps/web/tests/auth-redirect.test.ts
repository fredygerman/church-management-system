import { test } from "node:test"
import assert from "node:assert/strict"
import { isSafeInternalPath } from "../lib/shell/navigation"

// RM-012: the post-login callbackUrl (callback page and NextAuth redirect) must stay same-origin.

test("accepts ordinary internal paths", () => {
  assert.equal(isSafeInternalPath("/"), true)
  assert.equal(isSafeInternalPath("/portal"), true)
  assert.equal(isSafeInternalPath("/church-a/dashboard/home?tab=2#top"), true)
})

test("rejects protocol-relative and backslash host tricks", () => {
  assert.equal(isSafeInternalPath("//evil.example"), false)
  assert.equal(isSafeInternalPath("//evil.example/path"), false)
  assert.equal(isSafeInternalPath("/\\evil.example"), false)
  assert.equal(isSafeInternalPath("/%5Cevil.example"), true, "encoded form stays a path, not a host")
})

test("rejects absolute external URLs, scripts and control characters", () => {
  assert.equal(isSafeInternalPath("https://evil.example/home"), false)
  assert.equal(isSafeInternalPath("javascript:alert(1)"), false)
  assert.equal(isSafeInternalPath("/home\nSet-Cookie:x"), false)
  assert.equal(isSafeInternalPath("/home\\x"), false)
})

test("rejects empty, missing and oversized values", () => {
  assert.equal(isSafeInternalPath(null), false)
  assert.equal(isSafeInternalPath(undefined), false)
  assert.equal(isSafeInternalPath(""), false)
  assert.equal(isSafeInternalPath("/" + "a".repeat(2048)), false)
})
