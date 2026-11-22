import * as SecureStore from "expo-secure-store"

const ACCESS_TOKEN_KEY = "church.access-token"
const REFRESH_TOKEN_KEY = "church.refresh-token"

export type StoredTokens = {
  accessToken: string
  refreshToken: string
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ])

  return accessToken && refreshToken ? { accessToken, refreshToken } : null
}

export async function storeTokens(tokens: StoredTokens) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ])
}

export async function clearStoredTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ])
}
