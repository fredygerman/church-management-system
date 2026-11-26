import type { SecureStoreBackend } from "../lib/storage"

// In-memory secure store with switchable failures, injected through the storage seam.
export class FakeSecureStore implements SecureStoreBackend {
  values = new Map<string, string>()
  failRead = false
  failWrite = false
  deletes = 0

  async getItem(key: string) {
    if (this.failRead) throw new Error("keychain unavailable")
    return this.values.get(key) ?? null
  }
  async setItem(key: string, value: string) {
    if (this.failWrite) throw new Error("keychain write refused")
    this.values.set(key, value)
  }
  async deleteItem(key: string) {
    this.deletes++
    this.values.delete(key)
  }
}

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}
