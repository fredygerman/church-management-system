import { router, useSegments } from "expo-router"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, setSessionExpiredHandler, signOutRequest } from "./api"
import { clearStoredTokens, getStoredTokens, storeTokens, type StoredTokens } from "./storage"

export type SessionUser = { id?: string; name?: string | null; email?: string | null; churchId?: string | null; [key: string]: unknown }
type AuthResponse = StoredTokens & { user: SessionUser }
type SessionContextValue = { ready: boolean; signedIn: boolean; user: SessionUser | null; signIn: (response: AuthResponse) => Promise<void>; signOut: () => Promise<void> }

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null))
    let active = true
    getStoredTokens().then(async (tokens) => {
      if (tokens) {
        try {
          const currentUser = await api.get<SessionUser>("/users/me")
          if (active) setUser(currentUser)
        } catch {
          await clearStoredTokens()
        }
      }
      if (active) setReady(true)
    })
    return () => { active = false; setSessionExpiredHandler(undefined) }
  }, [])

  const value = useMemo<SessionContextValue>(() => ({
    ready,
    signedIn: Boolean(user),
    user,
    signIn: async (response) => { await storeTokens(response); setUser(response.user) },
    signOut: async () => { await signOutRequest(); setUser(null) },
  }), [ready, user])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error("useSession must be used inside SessionProvider")
  return context
}

export function SessionGate() {
  const { ready, signedIn } = useSession()
  const segments = useSegments()

  useEffect(() => {
    if (!ready) return
    const inAuth = segments[0] === "(auth)"
    const inMember = segments[0] === "(member)"
    const inStaff = segments[0] === "(staff)"
    if (!signedIn && (inMember || inStaff)) router.replace("/(auth)/sign-in")
    if (signedIn && inAuth) router.replace("/(member)")
  }, [ready, signedIn, segments])

  return null
}
