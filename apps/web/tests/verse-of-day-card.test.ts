import { test } from "node:test"
import assert from "node:assert/strict"
import {
  verseCardState,
  type VerseOfDay,
} from "../components/verses/verse-of-day-card"

const verse: VerseOfDay = {
  date: "2026-11-27",
  reference: "Psalm 23:1",
  text: "The Lord is my shepherd; I shall not want.",
  locale: "en",
  source: "rotation",
}

test("verseCardState: no data (not loaded or request failed) hides the card", () => {
  assert.deepEqual(verseCardState(null, "en"), { kind: "hidden" })
  assert.deepEqual(verseCardState(undefined, "sw"), { kind: "hidden" })
})

test("verseCardState: text present shows the verse in either locale", () => {
  assert.deepEqual(verseCardState(verse, "en"), { kind: "verse", verse })
  const sw = { ...verse, locale: "sw" as const, text: "Bwana ndiye mchungaji wangu." }
  assert.deepEqual(verseCardState(sw, "sw"), { kind: "verse", verse: sw })
})

test("verseCardState: null text in Swahili hides the card (D-23)", () => {
  const swMissing = { ...verse, locale: "sw" as const, text: null }
  assert.deepEqual(verseCardState(swMissing, "sw"), { kind: "hidden" })
})

test("verseCardState: null or blank text in English shows the quiet none line", () => {
  assert.deepEqual(verseCardState({ ...verse, text: null }, "en"), { kind: "none" })
  assert.deepEqual(verseCardState({ ...verse, text: "   " }, "en"), { kind: "none" })
})
