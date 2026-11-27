import { test } from "node:test"
import assert from "node:assert/strict"
import { addDays, buildDateRows, selectableEntries } from "../components/verses/date-rows"

const entries = [
  { id: "e1", reference: "Psalm 23:1", active: true },
  { id: "e2", reference: "John 3:16", active: false },
]

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-11-27", 3), "2026-11-30")
  assert.equal(addDays("2026-11-27", 29), "2026-12-26")
  assert.equal(addDays("2026-12-31", 1), "2027-01-01")
})

test("buildDateRows returns 30 rows starting today, with only the first marked today", () => {
  const rows = buildDateRows({ startDate: "2026-11-27", overrides: [], entries })
  assert.equal(rows.length, 30)
  assert.equal(rows[0].date, "2026-11-27")
  assert.equal(rows[0].isToday, true)
  assert.equal(rows[1].isToday, false)
  assert.equal(rows[29].date, "2026-12-26")
})

test("a day with no override uses rotation when active entries exist", () => {
  const rows = buildDateRows({ startDate: "2026-11-27", overrides: [], entries })
  assert.equal(rows[0].source, "rotation")
  assert.equal(rows[0].entryId, null)
  assert.equal(rows[0].reference, null)
})

test("a day with no override falls back to the built-in verse when no entry is active", () => {
  const rows = buildDateRows({
    startDate: "2026-11-27",
    overrides: [],
    entries: [{ id: "e2", reference: "John 3:16", active: false }],
  })
  assert.equal(rows[0].source, "default")
})

test("an override wins and shows the entry's current reference", () => {
  const rows = buildDateRows({
    startDate: "2026-11-27",
    overrides: [{ date: "2026-11-28", entryId: "e1", reference: "stale reference" }],
    entries,
  })
  assert.deepEqual(rows[1], {
    date: "2026-11-28",
    isToday: false,
    entryId: "e1",
    reference: "Psalm 23:1",
    source: "override",
  })
})

test("an override on an inactive entry still shows its reference", () => {
  const rows = buildDateRows({
    startDate: "2026-11-27",
    overrides: [{ date: "2026-11-27", entryId: "e2", reference: "John 3:16" }],
    entries,
  })
  assert.equal(rows[0].source, "override")
  assert.equal(rows[0].reference, "John 3:16")
})

test("selectableEntries offers active entries and keeps the current inactive choice", () => {
  assert.deepEqual(
    selectableEntries(entries, null).map((entry) => entry.id),
    ["e1"],
  )
  assert.deepEqual(
    selectableEntries(entries, "e2").map((entry) => entry.id),
    ["e1", "e2"],
  )
})
