import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { isValidJoinCode, normalizeJoinCode } from "../components/church-switcher/join-code"

describe("normalizeJoinCode", () => {
  it("trims, uppercases and drops hyphens and spaces so pasted codes work", () => {
    assert.equal(normalizeJoinCode("  k7mq-4xwd  "), "K7MQ4XWD")
    assert.equal(normalizeJoinCode("k7 mq 4x wd"), "K7MQ4XWD")
  })

  it("caps the result at 12 characters", () => {
    assert.equal(normalizeJoinCode("abcdefghijklmnop"), "ABCDEFGHIJKL")
  })

  it("leaves an empty input empty", () => {
    assert.equal(normalizeJoinCode("   "), "")
  })
})

describe("isValidJoinCode", () => {
  it("accepts 6 to 12 letters or digits", () => {
    assert.equal(isValidJoinCode("ABC123"), true)
    assert.equal(isValidJoinCode("K7MQ4XWD"), true)
    assert.equal(isValidJoinCode("ABCDEFGHJKLM"), true)
  })

  it("rejects codes shorter than 6 or longer than 12, and any other characters", () => {
    assert.equal(isValidJoinCode("ABC12"), false)
    assert.equal(isValidJoinCode("ABCDEFGHJKLMN"), false)
    assert.equal(isValidJoinCode(""), false)
    assert.equal(isValidJoinCode("ABC!23"), false)
  })
})
