import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { canSaveEntry, toEntryInput } from "../components/verses/entry-form"
import { roleHasVersePermission } from "../components/verses/permissions"

describe("canSaveEntry", () => {
  it("needs a reference and English text, ignoring surrounding spaces", () => {
    assert.equal(canSaveEntry({ reference: "Psalm 23:1", textEn: "The Lord is my shepherd", textSw: "" }), true)
    assert.equal(canSaveEntry({ reference: "   ", textEn: "text", textSw: "" }), false)
    assert.equal(canSaveEntry({ reference: "Psalm 23:1", textEn: "\n ", textSw: "Bwana ni mchungaji" }), false)
  })

  it("does not require Swahili text", () => {
    assert.equal(canSaveEntry({ reference: "John 3:16", textEn: "For God so loved", textSw: "" }), true)
  })
})

describe("toEntryInput", () => {
  it("trims values and includes Swahili text when present", () => {
    assert.deepEqual(
      toEntryInput({ reference: " John 3:16 ", textEn: " For God so loved ", textSw: " Kwa maana Mungu " }, "create"),
      { reference: "John 3:16", textEn: "For God so loved", textSw: "Kwa maana Mungu" },
    )
  })

  it("leaves an empty Swahili text out of a create request", () => {
    const input = toEntryInput({ reference: "John 3:16", textEn: "For God so loved", textSw: "  " }, "create")
    assert.equal("textSw" in input, false)
  })

  it("sends an empty Swahili text as null on update so the saved text is cleared", () => {
    const input = toEntryInput({ reference: "John 3:16", textEn: "For God so loved", textSw: "" }, "update")
    assert.deepEqual(input, { reference: "John 3:16", textEn: "For God so loved", textSw: null })
  })
})

describe("roleHasVersePermission", () => {
  it("denies missing, unknown and inherited role names", () => {
    assert.equal(roleHasVersePermission(undefined, "manage:verses"), false)
    assert.equal(roleHasVersePermission(null, "view:verses"), false)
    assert.equal(roleHasVersePermission("constructor", "manage:verses"), false)
    assert.equal(roleHasVersePermission("not-a-role", "view:verses"), false)
  })

  it("denies the plain member role", () => {
    assert.equal(roleHasVersePermission("member", "manage:verses"), false)
    assert.equal(roleHasVersePermission("member", "view:verses"), false)
  })
})
