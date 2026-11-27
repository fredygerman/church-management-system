import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { initialsFor } from "../components/ui/initials"

describe("initialsFor (Avatar fallback)", () => {
  it("uses first and last name initials", () => {
    assert.equal(initialsFor("Neema Mwang'oka"), "NM")
    assert.equal(initialsFor("  Amina   Mtesa "), "AM")
  })

  it("uses a single initial for a one-word name", () => {
    assert.equal(initialsFor("Baraka"), "B")
  })

  it("falls back to ? when there is no usable name", () => {
    assert.equal(initialsFor(""), "?")
    assert.equal(initialsFor("   "), "?")
  })

  it("uppercases lowercase input", () => {
    assert.equal(initialsFor("john doe"), "JD")
  })
})
