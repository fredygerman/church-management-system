import { afterEach, test } from "node:test"
import assert from "node:assert/strict"
import { getRotatedTokens, RefreshInProgressError } from "../lib/auth-refresh"

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

// Unsigned JWT with a payload; the refresh module only reads the exp claim.
function accessToken(): string {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64")
  return `header.${payload}.signature`
}

function respond(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

test("a parallel refresh (grace window) keeps the session usable for the next request", async () => {
  let calls = 0
  globalThis.fetch = (async () => {
    calls += 1
    if (calls === 1) return respond(401, { message: "Refresh already in progress", statusCode: 401 })
    return respond(200, { accessToken: accessToken(), refreshToken: "new-refresh" })
  }) as typeof fetch

  await assert.rejects(getRotatedTokens("http://api.test", "parallel-refresh"), RefreshInProgressError)
  const pair = await getRotatedTokens("http://api.test", "parallel-refresh")
  assert.equal(pair.refreshToken, "new-refresh")
  assert.equal(calls, 2, "the second call must reach the API again, not be blocked")
})

test("a rejected refresh token is not sent again in this process", async () => {
  let calls = 0
  globalThis.fetch = (async () => {
    calls += 1
    return respond(401, { message: "Invalid or expired refresh token", statusCode: 401 })
  }) as typeof fetch

  await assert.rejects(getRotatedTokens("http://api.test", "reused-token"), /Token refresh failed \(401\)/)
  await assert.rejects(getRotatedTokens("http://api.test", "reused-token"), /sign in again/)
  assert.equal(calls, 1)
})
