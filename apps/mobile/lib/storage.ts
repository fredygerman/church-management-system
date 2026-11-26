export const ACCESS_TOKEN_KEY = "church.access-token"
export const REFRESH_TOKEN_KEY = "church.refresh-token"

export type StoredTokens = {
  accessToken: string
  refreshToken: string
}

export type SecureStoreBackend = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  deleteItem: (key: string) => Promise<void>
}

let backend: SecureStoreBackend | undefined

// Loaded lazily: the native module is only needed on a device, and tests inject a store instead.
async function secureStore(): Promise<SecureStoreBackend> {
  if (backend) return backend
  const SecureStore = await import("expo-secure-store")
  return {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    deleteItem: SecureStore.deleteItemAsync,
  }
}

/** Test seam: replaces the secure store. Pass undefined to restore the device store. */
export function setSecureStoreBackend(next: SecureStoreBackend | undefined) {
  backend = next
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const store = await secureStore()
  const [accessToken, refreshToken] = await Promise.all([store.getItem(ACCESS_TOKEN_KEY), store.getItem(REFRESH_TOKEN_KEY)])
  return accessToken && refreshToken ? { accessToken, refreshToken } : null
}

export async function storeTokens(tokens: StoredTokens) {
  const store = await secureStore()
  await store.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  await store.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export async function clearStoredTokens() {
  const store = await secureStore()
  await store.deleteItem(ACCESS_TOKEN_KEY)
  await store.deleteItem(REFRESH_TOKEN_KEY)
}
