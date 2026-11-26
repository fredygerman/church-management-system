import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createRequestGate } from "../lib/request-gate"

describe("createRequestGate", () => {
  it("discards a response once a newer request has started", () => {
    const gate = createRequestGate()
    const staleAFinished = gate.start()
    const currentB = gate.start()
    assert.equal(staleAFinished(), false, "A's late response must be discarded after B started")
    assert.equal(currentB(), true)
  })

  it("discards every pending response when the context is invalidated", () => {
    const gate = createRequestGate()
    const pending = gate.start()
    gate.invalidate()
    assert.equal(pending(), false, "a response from a previous branch must not render after a context change")
  })
})
