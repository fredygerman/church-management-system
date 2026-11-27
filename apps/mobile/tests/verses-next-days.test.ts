import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { addDays, buildNextDays, darTodayIso } from "../components/verses/next-days"

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01")
    assert.equal(addDays("2026-11-27", 3), "2026-11-30")
    assert.equal(addDays("2026-11-27", 4), "2026-12-01")
  })

  it("handles February in leap and non-leap years", () => {
    assert.equal(addDays("2026-02-27", 2), "2026-03-01")
    assert.equal(addDays("2028-02-28", 1), "2028-02-29")
  })

  it("returns the same date for zero days", () => {
    assert.equal(addDays("2026-11-27", 0), "2026-11-27")
  })
})

describe("darTodayIso", () => {
  it("uses the Dar es Salaam calendar day (UTC+3), not the UTC day", () => {
    // 21:30 UTC on 27 Nov is 00:30 on 28 Nov in Dar es Salaam.
    assert.equal(darTodayIso(new Date("2026-11-27T21:30:00Z")), "2026-11-28")
    // 20:59 UTC is still 23:59 on 27 Nov in Dar es Salaam.
    assert.equal(darTodayIso(new Date("2026-11-27T20:59:00Z")), "2026-11-27")
  })
})

describe("buildNextDays", () => {
  const today = "2026-11-27"

  it("returns 30 consecutive days starting today, with only the first marked as today", () => {
    const rows = buildNextDays(today, [], true)
    assert.equal(rows.length, 30)
    assert.equal(rows[0].date, "2026-11-27")
    assert.equal(rows[29].date, "2026-12-26")
    assert.equal(rows[0].isToday, true)
    assert.ok(rows.slice(1).every((row) => row.isToday === false))
  })

  it("uses the rotation source for automatic days when the church list has active entries", () => {
    const rows = buildNextDays(today, [], true)
    assert.ok(rows.every((row) => row.source === "rotation" && row.entryId === null && row.reference === null))
  })

  it("uses the built-in default source for automatic days when no entry is active", () => {
    const rows = buildNextDays(today, [], false)
    assert.ok(rows.every((row) => row.source === "default"))
  })

  it("applies a staff override to its day only and keeps the automatic source elsewhere", () => {
    const rows = buildNextDays(today, [{ date: "2026-11-29", entryId: "entry-7", reference: "Psalm 23:1" }], true)
    const picked = rows.find((row) => row.date === "2026-11-29")
    assert.deepEqual(picked, { date: "2026-11-29", isToday: false, source: "override", entryId: "entry-7", reference: "Psalm 23:1" })
    assert.equal(rows.filter((row) => row.source === "override").length, 1)
    assert.equal(rows.find((row) => row.date === "2026-11-28")?.source, "rotation")
  })

  it("can mark today as an override", () => {
    const rows = buildNextDays(today, [{ date: today, entryId: "entry-1", reference: "John 3:16" }], false)
    assert.equal(rows[0].source, "override")
    assert.equal(rows[0].isToday, true)
  })

  it("ignores overrides outside the 30-day window", () => {
    const rows = buildNextDays(today, [
      { date: "2026-11-26", entryId: "past", reference: "Old" },
      { date: "2026-12-27", entryId: "later", reference: "Later" },
    ], true)
    assert.equal(rows.some((row) => row.source === "override"), false)
  })

  it("honours a custom window length", () => {
    const rows = buildNextDays(today, [], true, 7)
    assert.equal(rows.length, 7)
    assert.equal(rows[6].date, "2026-12-03")
  })
})
