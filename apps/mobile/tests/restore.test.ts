import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { ApiError } from "../lib/api"
import { restoreSession, type RestoreDeps } from "../lib/restore"

const tokens = { accessToken: "a", refreshToken: "r" }

function deps(overrides: Partial<RestoreDeps<{ id: string }>>) {
  const calls = { clear: 0 }
  const restore: RestoreDeps<{ id: string }> = {
    readTokens: async () => tokens,
    loadUser: async () => ({ id: "u1" }),
    clear: async () => { calls.clear++ },
    ...overrides,
  }
  return { restore, calls }
}

describe("restoreSession", () => {
  it("authenticates when the stored pair is accepted", async () => {
    const { restore, calls } = deps({})
    assert.deepEqual(await restoreSession(restore), { status: "authenticated", user: { id: "u1" } })
    assert.equal(calls.clear, 0)
  })

  it("is signed out only when there is nothing stored", async () => {
    const { restore } = deps({ readTokens: async () => null })
    assert.deepEqual(await restoreSession(restore), { status: "signed-out" })
  })

  it("settles as unavailable and keeps credentials when the secure store cannot be read", async () => {
    const { restore, calls } = deps({ readTokens: async () => { throw new Error("keychain locked") } })
    assert.deepEqual(await restoreSession(restore), { status: "unavailable" })
    assert.equal(calls.clear, 0)
  })

  it("keeps credentials when the API is temporarily unavailable at startup", async () => {
    const { restore, calls } = deps({ loadUser: async () => { throw new ApiError("Service unavailable", "http", 503) } })
    assert.deepEqual(await restoreSession(restore), { status: "unavailable" })
    assert.equal(calls.clear, 0)
  })

  it("keeps credentials on a network failure at startup", async () => {
    const { restore, calls } = deps({ loadUser: async () => { throw new ApiError("offline", "network") } })
    assert.deepEqual(await restoreSession(restore), { status: "unavailable" })
    assert.equal(calls.clear, 0)
  })

  it("clears credentials and signs out once when the API rejects the session", async () => {
    const { restore, calls } = deps({ loadUser: async () => { throw new ApiError("expired", "rejected", 401) } })
    assert.deepEqual(await restoreSession(restore), { status: "signed-out" })
    assert.equal(calls.clear, 1)
  })
})
