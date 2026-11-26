import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { ApiError } from "../lib/api"
import { classifyCheckinError } from "../lib/checkin"

describe("classifyCheckinError", () => {
  it("separates duplicate and closed-session 400 responses by the server message", () => {
    assert.equal(classifyCheckinError(new ApiError("Member already checked in for this session", "http", 400)), "duplicate")
    assert.equal(classifyCheckinError(new ApiError("Session must be open for check-in", "http", 400)), "closed")
    assert.equal(classifyCheckinError(new ApiError("memberId must be a UUID", "http", 400)), "invalid")
  })

  it("maps 403 and 404 to their own outcomes", () => {
    assert.equal(classifyCheckinError(new ApiError("Forbidden", "http", 403)), "forbidden")
    assert.equal(classifyCheckinError(new ApiError("Member not found", "http", 404)), "not-found")
  })

  it("treats network, server and unknown failures as retryable unavailability", () => {
    assert.equal(classifyCheckinError(new ApiError("offline", "network")), "unavailable")
    assert.equal(classifyCheckinError(new ApiError("boom", "http", 500)), "unavailable")
    assert.equal(classifyCheckinError(new Error("plain")), "unavailable")
  })
})
