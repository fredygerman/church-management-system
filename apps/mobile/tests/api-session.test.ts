import { after, before, beforeEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import { FakeSecureStore, json } from "./support"
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, setSecureStoreBackend } from "../lib/storage"
import type * as ApiModule from "../lib/api"

// The base URL is read when the module loads, so the module is imported after setting it.
process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.test"
let api: typeof ApiModule
const realFetch = globalThis.fetch
let store: FakeSecureStore
let expired = 0

type Handler = (url: string, init: RequestInit) => Promise<Response> | Response
let handler: Handler = () => json(500, { success: false })
let calls: string[] = []

function seed(access = "a1", refresh = "r1") {
  store.values.set(ACCESS_TOKEN_KEY, access)
  store.values.set(REFRESH_TOKEN_KEY, refresh)
}
const stored = () => ({ access: store.values.get(ACCESS_TOKEN_KEY) ?? null, refresh: store.values.get(REFRESH_TOKEN_KEY) ?? null })

before(async () => {
  api = await import("../lib/api")
  api.setSessionExpiredHandler(() => { expired++ })
})
after(() => {
  globalThis.fetch = realFetch
  setSecureStoreBackend(undefined)
  api.setSessionExpiredHandler(undefined)
})
beforeEach(() => {
  store = new FakeSecureStore()
  setSecureStoreBackend(store)
  expired = 0
  calls = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace("https://api.test", "")
    calls.push(url)
    return handler(url, init ?? {})
  }) as typeof fetch
})

const meRoute = (token: string) => (url: string, init: RequestInit) => {
  if (url !== "/users/me") return json(404, { success: false })
  const auth = new Headers(init.headers).get("Authorization")
  return auth === `Bearer ${token}` ? json(200, { success: true, data: { id: "u1" } }) : json(401, { success: false, message: "Unauthorized" })
}

describe("renewal", () => {
  it("renews once, persists the rotated pair and retries the original request", async () => {
    seed()
    handler = (url, init) => {
      if (url === "/auth/refresh") return json(200, { success: true, data: { accessToken: "a2", refreshToken: "r2" } })
      return meRoute("a2")(url, init)
    }
    const me = await api.api.get<{ id: string }>("/users/me")
    assert.equal(me.id, "u1")
    assert.deepEqual(stored(), { access: "a2", refresh: "r2" })
    assert.equal(calls.filter((url) => url === "/auth/refresh").length, 1)
  })

  it("shares one refresh between concurrent 401s", async () => {
    seed()
    handler = (url, init) => {
      if (url === "/auth/refresh") return json(200, { success: true, data: { accessToken: "a2", refreshToken: "r2" } })
      return meRoute("a2")(url, init)
    }
    const [one, two] = await Promise.all([api.api.get<{ id: string }>("/users/me"), api.api.get<{ id: string }>("/users/me")])
    assert.equal(one.id, "u1")
    assert.equal(two.id, "u1")
    assert.equal(calls.filter((url) => url === "/auth/refresh").length, 1)
  })
})

describe("temporary failures keep the session", () => {
  it("keeps the stored pair when the refresh cannot reach the API", async () => {
    seed()
    handler = (url, init) => {
      if (url === "/auth/refresh") throw new TypeError("network down")
      return meRoute("a2")(url, init)
    }
    await assert.rejects(api.api.get("/users/me"), (error: unknown) => error instanceof api.ApiError && error.kind === "network")
    assert.deepEqual(stored(), { access: "a1", refresh: "r1" })
    assert.equal(store.deletes, 0)
    assert.equal(expired, 0)
  })

  it("keeps the stored pair on a refresh 503", async () => {
    seed()
    handler = (url, init) => (url === "/auth/refresh" ? json(503, { success: false, message: "Service unavailable" }) : meRoute("a2")(url, init))
    await assert.rejects(api.api.get("/users/me"), (error: unknown) => error instanceof api.ApiError && error.kind === "http" && error.status === 503)
    assert.deepEqual(stored(), { access: "a1", refresh: "r1" })
    assert.equal(expired, 0)
  })

  it("treats a parallel refresh race as temporary, not a rejection", async () => {
    seed()
    handler = (url, init) => (url === "/auth/refresh" ? json(401, { success: false, message: "Refresh already in progress" }) : meRoute("a2")(url, init))
    await assert.rejects(api.api.get("/users/me"), (error: unknown) => error instanceof api.ApiError && error.kind === "http")
    assert.deepEqual(stored(), { access: "a1", refresh: "r1" })
  })

  it("keeps the stored pair when the refresh response is malformed", async () => {
    seed()
    handler = (url, init) => (url === "/auth/refresh" ? json(200, { success: true, data: {} }) : meRoute("a2")(url, init))
    await assert.rejects(api.api.get("/users/me"), (error: unknown) => error instanceof api.ApiError && error.kind === "malformed")
    assert.deepEqual(stored(), { access: "a1", refresh: "r1" })
  })

  it("reports a secure-store read failure without deleting anything", async () => {
    seed()
    store.failRead = true
    await assert.rejects(api.api.get("/users/me"), (error: unknown) => error instanceof api.ApiError && error.kind === "storage")
    assert.equal(store.deletes, 0)
    assert.equal(expired, 0)
  })

  it("uses the rotated pair in memory when the store refuses to save it, then saves it later", async () => {
    seed()
    handler = (url, init) => (url === "/auth/refresh" ? json(200, { success: true, data: { accessToken: "a2", refreshToken: "r2" } }) : meRoute("a2")(url, init))
    store.failWrite = true
    const me = await api.api.get<{ id: string }>("/users/me")
    assert.equal(me.id, "u1")
    // The old refresh token is spent, so the stored pair must not be the one that was rotated away.
    assert.deepEqual(stored(), { access: "a1", refresh: "r1" })
    store.failWrite = false
    await api.api.get<{ id: string }>("/users/me")
    assert.deepEqual(stored(), { access: "a2", refresh: "r2" })
  })
})

describe("definitive rejection", () => {
  it("clears credentials once when the API rejects the refresh token", async () => {
    seed()
    handler = (url, init) => (url === "/auth/refresh" ? json(401, { success: false, message: "Invalid or expired refresh token" }) : meRoute("a2")(url, init))
    await assert.rejects(api.api.get("/users/me"), (error: unknown) => error instanceof api.ApiError && error.kind === "rejected")
    assert.deepEqual(stored(), { access: null, refresh: null })
    assert.equal(expired, 1)
  })
})

describe("late responses after a session change are discarded", () => {
  it("does not restore credentials when sign-out happens while renewal is pending", async () => {
    seed()
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    handler = async (url, init) => {
      if (url === "/auth/refresh") {
        await gate
        return json(200, { success: true, data: { accessToken: "a2", refreshToken: "r2" } })
      }
      if (url === "/auth/logout") return json(200, { success: true })
      return meRoute("a2")(url, init)
    }
    const pending = api.api.get("/users/me")
    await new Promise((resolve) => setTimeout(resolve, 5))
    await api.signOutRequest()
    release()
    await assert.rejects(pending, (error: unknown) => error instanceof api.ApiError && error.kind === "stale")
    assert.deepEqual(stored(), { access: null, refresh: null })
  })

  it("discards a renewal that finishes after a different account signed in", async () => {
    seed()
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    handler = async (url, init) => {
      if (url === "/auth/refresh") {
        await gate
        return json(200, { success: true, data: { accessToken: "old-a2", refreshToken: "old-r2" } })
      }
      return meRoute("a2")(url, init)
    }
    const pending = api.api.get("/users/me")
    await new Promise((resolve) => setTimeout(resolve, 5))
    await api.persistSession({ accessToken: "new-a", refreshToken: "new-r" })
    release()
    await assert.rejects(pending, (error: unknown) => error instanceof api.ApiError && error.kind === "stale")
    assert.deepEqual(stored(), { access: "new-a", refresh: "new-r" })
  })
})
